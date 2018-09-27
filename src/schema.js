const Database = new require('./database');

module.exports = class Schema {
    constructor(connectionString) {
        this.db = new Database(connectionString);
        this.getSchemasQuery = `
            select
            T.TABLE_NAME,
            C.COLUMN_NAME,
            C.DATA_TYPE,
            COLUMNPROPERTY(object_id(C.TABLE_SCHEMA+'.'+C.TABLE_NAME), C.COLUMN_NAME, 'IsIdentity') as IS_IDENTITY,
            C.CHARACTER_MAXIMUM_LENGTH,
            C.IS_NULLABLE,
            ISNULL(OBJECTPROPERTY(OBJECT_ID(U.CONSTRAINT_SCHEMA + '.' + QUOTENAME(U.CONSTRAINT_NAME)), 'IsPrimaryKey'),0) as IS_PRIMARY_KEY,
            U.ORDINAL_POSITION
            from information_schema.COLUMNS C
            INNER JOIN INFORMATION_SCHEMA.TABLES T ON T.TABLE_NAME = C.TABLE_NAME
            LEFT OUTER JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS TC ON (TC.CONSTRAINT_TYPE = 'PRIMARY KEY' AND TC.TABLE_NAME = T.TABLE_NAME)
            LEFT OUTER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE U ON (U.COLUMN_NAME = C.COLUMN_NAME AND U.TABLE_NAME = C.TABLE_NAME AND U.CONSTRAINT_NAME = TC.CONSTRAINT_NAME)
            where T.TABLE_TYPE = 'BASE TABLE'
        `;

        this.getRelationsQuery = `
            SELECT distinct
            tab1.name AS [table],
            col1.name AS [column], 
            tab2.name AS [referenced_table], 
            col2.name AS [referenced_column] 
        FROM sys.foreign_key_columns fkc 
        INNER JOIN sys.objects obj 
            ON obj.object_id = fkc.constraint_object_id 
        INNER JOIN sys.tables tab1 
            ON tab1.object_id = fkc.parent_object_id 
        INNER JOIN sys.schemas sch 
            ON tab1.schema_id = sch.schema_id 
        INNER JOIN sys.columns col1 
            ON col1.column_id = parent_column_id AND col1.object_id = tab1.object_id 
        INNER JOIN sys.tables tab2 
            ON tab2.object_id = fkc.referenced_object_id 
        INNER JOIN sys.columns col2 
            ON col2.column_id = referenced_column_id AND col2.object_id = tab2.object_id 
        `;

        this.getUksQuery = `select
        u.TABLE_NAME,
        u.CONSTRAINT_NAME,
        u.COLUMN_NAME
        from INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE u
        inner join INFORMATION_SCHEMA.TABLE_CONSTRAINTS c on u.CONSTRAINT_NAME = c.CONSTRAINT_NAME        
        where c.CONSTRAINT_TYPE = 'UNIQUE'
        order by TABLE_NAME, CONSTRAINT_NAME
        `;

        this.getFksQuery = `SELECT * FROM (
            SELECT  
                fk.name,
                OBJECT_NAME(fk.parent_object_id) AS TABLE_NAME,
                c1.name AS COLUMN_NAME,
                OBJECT_NAME(fk.referenced_object_id) AS REFERED_TABLE,
                c2.name AS REFERED_COLUMN
            FROM  sys.foreign_keys fk
            INNER JOIN  sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
            INNER JOIN sys.columns c1 ON fkc.parent_column_id = c1.column_id AND fkc.parent_object_id = c1.object_id
            INNER JOIN sys.columns c2 ON fkc.referenced_column_id = c2.column_id AND fkc.referenced_object_id = c2.object_id
            ) FKS
            ORDER BY FKS.TABLE_NAME, COLUMN_NAME`
    }

    getSchemas() {
        return Promise.all([
            this.getColumns(),
            this.getRelations(),
            this.getUks(),
            this.getFks()
        ])
            .then(this.mapRelations)
            .then(mapToArray);
    }

    getRelations() {
        return this.db.query(this.getRelationsQuery);
    }

    getColumns() {
        return this.db.query(this.getSchemasQuery)
            .then(resultToMap);
    }

    getUks(){
        return this.db.query(this.getUksQuery);
    }

    getFks(){
        return this.db.query(this.getFksQuery);
    }

    mapRelations([tables, relations, uks, fks]) {
        if (!relations) return tables;

        // Adiciona em cada coluna o apontamento para a tabela que a pertence.
        for (const tbl in tables) {
            for (const col in tables[tbl].columns){
                tables[tbl].columns[col].TABLE = tables[tbl];
            }
        }

        // Cria inRelations e outRelations
        relations.forEach(r => {
            if (tables[r.table]) {
                tables[r.table].inRelations = tables[r.table].inRelations || [];
                tables[r.table].inRelations.push(r);
            }

            if (tables[r.referenced_table]) {
                tables[r.referenced_table].outRelations = tables[r.referenced_table].outRelations || [];
                tables[r.referenced_table].outRelations.push(r);
            }
        });

        // Inicializa UKs das tabelas
        uks.forEach(u => {
            if (tables[u.TABLE_NAME]) {
                tables[u.TABLE_NAME].unique = tables[u.TABLE_NAME].unique || {};
                if (!tables[u.TABLE_NAME].unique.name){
                    tables[u.TABLE_NAME].unique.name = u.CONSTRAINT_NAME
                }
                if (tables[u.TABLE_NAME].unique.name === u.CONSTRAINT_NAME){
                    tables[u.TABLE_NAME].unique.columns = tables[u.TABLE_NAME].unique.columns || []
                    tables[u.TABLE_NAME].unique.columns.push(tables[u.TABLE_NAME].columns[u.COLUMN_NAME])
                }
            }
        });

        // Inicializa FKs das colunas
        fks.forEach(f => {
            if (tables[f.TABLE_NAME]) {
                if (tables[f.TABLE_NAME].columns[f.COLUMN_NAME]){
                    tables[f.TABLE_NAME].columns[f.COLUMN_NAME].referedTable = tables[f.REFERED_TABLE]
                }
            }
        });



        return tables;
    }

}


function resultToMap(array) {
    return array.reduce((p, c) => {
        p[c.TABLE_NAME] = p[c.TABLE_NAME] || { tableName: c.TABLE_NAME, columns: {} };
        p[c.TABLE_NAME].columns[c.COLUMN_NAME] = c;
        return p;
    }, {});
}

function mapToArray(map) {
    const array = [];
    for (const key in map) {
        const element = map[key];
        array.push(element);
    }
    return array;
}