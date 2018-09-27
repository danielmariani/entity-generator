const util = require('./util.js');

module.exports = class Entity {
    constructor(schema, info) {
        this.tableName = schema.tableName;
        this.info = info && info[schema.tableName] ? info[schema.tableName] : null;
        this.className = this.getClassName(schema.tableName);
        this.Properties = this.getProperties(schema.columns);
        this.inRelations = (schema.inRelations || []).map(r => new Relation(r, info));
        this.outRelations = (schema.outRelations || []).map(r => new Relation(r, info));
        this.uniqueKey = schema.unique ? new UniqueKey(schema.unique, this) : undefined;
        this.disambiguateRelations(this.inRelations, 'refProp');
        this.disambiguateRelations(this.outRelations, 'prop');
    }

    getClassName(tableName) {
        if (this.info) {
            return this.info.name;
        }

        return util.toPascalCase(tableName);
    }

    getProperties(columns) {
        const properties = [];

        for (let key in columns) {
            if (this.name === 'RegAbastecimentoTanque'){
                var a = '';
                if (key === 'IdcAbastecimento'){
                    var a = '';
                }

            }
            properties.push(new Property(columns[key], this.info, this));
        }

        return properties;
    }

    disambiguateRelations(relations, prop) {
        const ambiguousProp = this.getAmiguousMap(relations, prop);
        this.addSuffix(relations, ambiguousProp, prop);
    }

    addSuffix(relations, ambiguousMap, prop) {
        for (const key in ambiguousMap) {
            const ambiguousRelations = relations
                .filter(r => r[prop] === key);

            const suffixIndex = getSuffixIndex(ambiguousRelations.map(r => r.column));

            ambiguousRelations.forEach(relation => {
                const suffix = relation.column.substring(suffixIndex);
                relation[prop] += suffix;
            });
        }
    }

    getAmiguousMap(relations, prop) {
        const counts = relations.reduce((p, c) => {
            p[c[prop]] = (p[c[prop]] || 0) + 1;
            return p;
        }, {});

        for (const key in counts) {
            if (counts[key] === 1) {
                delete counts[key];
            }
        }

        return counts;
    }
}

function getSuffixIndex(array) {
    let suffixIndex = 0;

    letterLoop: while (true) {
        const currentLetter = array[0][suffixIndex];
        for (let i = 1; i < array.length; i++) {
            if (
                array[i][suffixIndex] !== currentLetter ||
                !array[i][suffixIndex]
            ) {
                break letterLoop;
            }
        }
        suffixIndex++;
    }

    return suffixIndex;
}

class UniqueKey{
    constructor(ukSchema, entity)
    {
        if(!ukSchema)
            return;
        this.name = ukSchema.name;
        this.properties = [];
        ukSchema.columns.forEach(col => {
            if (entity.Properties){
                var p = entity.Properties.find(p => p.columnName === col.COLUMN_NAME);
                this.properties.push(p);

            }
        });
    }
}

class Property {
    constructor(columnSchema, info, entity) {
        this.columnName = columnSchema.COLUMN_NAME;
        this.info = this.getInfo(info);
        this.constantName = this.info ? this.info.constantName : null;
        this.listOfValues = this.info ? this.info.listOfValues : null;
        this.propertyName = this.getPropertyName(columnSchema.COLUMN_NAME);
        this.type = util.sqlTypeToCSharpType(columnSchema.DATA_TYPE);
        this.isIdentity = !!columnSchema.IS_IDENTITY;
        this.size = columnSchema.CHARACTER_MAXIMUM_LENGTH;
        this.isNullable = columnSchema.IS_NULLABLE === 'YES';
        this.isPrimaryKey = !!columnSchema.IS_PRIMARY_KEY;
        this.order = columnSchema.ORDINAL_POSITION ? parseInt(columnSchema.ORDINAL_POSITION) : null;
        this.entity = entity;
        this.referedEntity = columnSchema.referedTable;
    }

    getPropertyName(columnName) {
        if (this.info) {
            return this.info.name;
        }
        return util.toPascalCase(columnName);
    }

    getInfo(info) {
        if (info) {
            return info.columns.find(i => {
                return i.code === this.columnName;
            });
        }
    }
}

class Relation {
    constructor(r, info) {
        this.info = info;
        this.class = this.getClassName(r.table);
        this.column = this.getColumnName(r.table, r.column);
        this.refClass = this.getClassName(r.referenced_table);
        this.refColumn = this.getColumnName(r.referenced_table, r.referenced_column);
        this.prop = this.getProp();
        this.refProp = this.getRefProp();
    }

    getProp() {
        if (this.class === this.refClass) {
            const suffix = this.column.substring(getSuffixIndex([this.column, this.refColumn]));
            return this.class + suffix;
        }

        return this.class;
    }

    getRefProp() {
        if (this.class === this.refClass) {
            const suffix = this.column.substring(getSuffixIndex([this.column, this.refColumn]));
            return this.class + suffix;
        }

        return this.refClass;
    }

    getClassName(tableName) {
        if (this.info && this.info[tableName]) {
            return this.info[tableName].name;
        }
        return util.toPascalCase(tableName);
    }

    getColumnName(tableName, columnName) {
        let name = null;

        if (this.info && this.info[tableName]) {
            for (let c of this.info[tableName].columns) {
                if (c.code === columnName) {
                    name = c.name;
                    break;
                }
            }
        }

        return name || util.toPascalCase(columnName);
    }
}