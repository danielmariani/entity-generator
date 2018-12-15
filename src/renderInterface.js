//@ts-check

module.exports = function (namespace) {
    return function (entity, schema) {
        return `/*
=============================================================================
    ATENTION!

    This file has been automatically generated.
    Any manual alteration to this file will be lost on the next generation.
    To customize this class use a partial class.
=============================================================================
 */        

namespace ${namespace}.Interfaces
{
    using System;
    using System.Linq;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Text;
    using IHM.Data.DbProviderFactory;
    using System.Data;
    using System.Linq.Expressions;

    public partial class Interface${entity.className} : InterfaceDataAccess<${entity.className}, Interface${entity.className}.Filtros>
    {
        public Interface${entity.className}()
        {
            base.DbSet = db.${entity.className};
        }

        public Interface${entity.className}(Context db) : base(db)
        {
            base.DbSet = db.${entity.className};
        }


${generateMapDeclare(entity)}
        private Dictionary<string, ${getPk(entity).type.csharpType}> _map${entity.className};
        public Dictionary<string, ${getPk(entity).type.csharpType}> Map${entity.className}
        {
            get
            {
                if (_map${entity.className} is null)
                    _map${entity.className} = GetUniqueMap();

                return _map${entity.className};
            }
        }

        public IQueryable<${entity.className}ExportSimple> ExportSimple(Expression<Func<${entity.className}, bool>> predicate = null)
        {
            db.Database.CommandTimeout = TIMEOUT_EXPORT;
            
            return db.${entity.className}
                .Where(predicate ?? (x => true))
                .Select(
                reg => new ${entity.className}ExportSimple
                {
                    Key = ${getPkName(entity)},
${generatePropertyInExportSimple(entity)}
                });
        }

        public IQueryable<${entity.className}Export> Export(Expression<Func<${entity.className}, bool>> predicate = null)
        {
            db.Database.CommandTimeout = TIMEOUT_EXPORT;
            
            return db.${entity.className}
                .Where(predicate ?? (x => true))
                .Select(
                reg => new ${entity.className}Export
                {
                    Key = ${getPkName(entity)},
${generatePropertyInExport(entity)}
                });
        }

        public override ${entity.className} GetByUnique(Dictionary<string,object> dic, string sufixo = "")
        {
            if (dic.Count == 0)
            {
                return null;
            } 

${((entity.uniqueKey || {}).properties || []).map(prop => renderUkDicDeclaration(prop))
                .filter(line => line)
                .join('\n')}
            
            return base.DbSet
${((entity.uniqueKey || {}).properties || []).map(prop => renderUkDicWhere(prop))
                .filter(line => line)
                .join('\n')}
                .FirstOrDefault();
        }

        public override ${entity.className} GetByUnique(${entity.className} entity)
        {
${((entity.uniqueKey || {}).properties || []).map(prop => renderUkObjDeclaration(prop))
                .filter(line => line)
                .join('\n')}

            return base.DbSet
${((entity.uniqueKey || {}).properties || []).map(prop => renderUkObjWhere(prop))
                .filter(line => line)
                .join('\n')}
                .FirstOrDefault();
        }

        public override ${entity.className} DictionaryToEntity(Dictionary<string, object> dic)
        {
            ${entity.className} entity = new ${entity.className}();
${entity.Properties.map(prop => renderPropertyInImport(prop))
                .filter(line => line)
                .join('\n')}
            return entity;
        }

        public partial class Filtros : FiltrosParent
        {

        }

        public string Import(string[] values)
        {
            IProviderFactory pf = ProviderFactories.GetFactory(base.ConnectionString);
            using (IDbConnection conn = pf.CreateConnection(base.ConnectionString))
            {
                conn.Open();
                StringBuilder sql = new StringBuilder();
                sql.Append("insert into ${entity.tableName} (");
${entity.Properties.map(generateAppendcolum).filter(line => line).join("\n").replace(/,"\);$/, '");')}
                sql.Append(" ) output");
                sql.Append(" inserted.${entity.Properties.filter(p => p.isPrimaryKey)[0].columnName}");
                sql.Append(" values (");
${entity.Properties.map(genereteAppendValue).filter(line => line).join("\n").replace(/,"\);$/, '");')}                    
                sql.Append(" );");
                IDbCommand cmd = pf.CreateCommand(sql.ToString(), conn);
                cmd.CommandTimeout = TIMEOUT_IMPORT;
${addParameter(entity.Properties)}

                // Executa o comando e preenche campos de retorno
                using (IDataReader reader = cmd.ExecuteReader())
                {                    
                    if (reader.Read())
                    {
                        if (!reader.IsDBNull(0))
                        {
                            var id = reader.GetInt32(0);
                            return $"UPDATE ${entity.tableName} SET IDC_REMOTO = {id} WHERE IDC_REMOTO = {values[0]};\\n";
                        }
                        else
                        {
                            throw new Exception("Nao houve retorno do campo key.");
                        }

                    }                    
                }
            }

            return null;
        }

        public string ImportMap(string[] values)
        {
            var uniqueKey = string.Join("|", new object[] { ${generateUniqueValuesInOrder(entity)} })
                .ToUpper()
                .Trim();

            if (
                (!SkipDuplicateCheck("${entity.tableName}")) &&
                (!string.IsNullOrEmpty(uniqueKey)) && 
                Map${entity.className}.ContainsKey(uniqueKey)
            )
            {
                InsertIdcRemotoMap("${entity.tableName}", Convert.ToInt32(values[0]), Map${entity.className}[uniqueKey]);
                return null;
            }


            IProviderFactory pf = ProviderFactories.GetFactory(base.ConnectionString);
            using (IDbConnection conn = pf.CreateConnection(base.ConnectionString))
            {
                conn.Open();
                StringBuilder sql = new StringBuilder();
                sql.Append("insert into ${entity.tableName} (");
${entity.Properties.map(generateAppendcolum).filter(line => line).join("\n").replace(/,"\);$/, '");')}
                sql.Append(" ) output");
                sql.Append(" inserted.${entity.Properties.filter(p => p.isPrimaryKey)[0].columnName}");
                sql.Append(" values (");
${entity.Properties.map(genereteAppendValueMap).filter(line => line).join("\n").replace(/,"\);$/, '");')}                    
                sql.Append(" );");
                IDbCommand cmd = pf.CreateCommand(sql.ToString(), conn);
                cmd.CommandTimeout = TIMEOUT_IMPORT;

${addParameterMap(entity.Properties)}

                // Executa o comando e preenche campos de retorno
                using (IDataReader reader = cmd.ExecuteReader())
                {                    
                    if (reader.Read())
                    {
                        if (!reader.IsDBNull(0))
                        {
                            var id = reader.GetInt32(0);
                            InsertIdcRemotoMap("${entity.tableName}", Convert.ToInt32(values[0]), id);
                        }
                        else
                        {
                            throw new Exception("Nao houve retorno do campo key.");
                        }

                    }                    
                }
            }

            return null;
        }

        public static string GetIdcSelect(${generateGetIdcSelectParamContainer(entity)})
        {
            var sb = new StringBuilder();
            sb.Append("(SELECT TOP 1 ${entity.tableName}.${entity.Properties.filter(p => p.isPrimaryKey)[0].columnName} FROM ${entity.tableName}");
${generateLeftJoin(entity)}
            sb.Append(" WHERE 1=1 ");
${generateGetIdcSelectBody(entity)}
            sb.Append(")");
            return sb.ToString();
        }

        public object[] GetUniqueValues(${getPk(entity).type.csharpType} id)
        {
            var entity = base.DbSet
${((entity.uniqueKey || {}).properties || []).map(prop => renderGetUniqueValuesInclude(prop))
                .filter(line => line)
                .join('\n')}                
                .Where(p => p.${getPk(entity).propertyName} == id).First();
            var values = new List<object>();
${((entity.uniqueKey || {}).properties || []).map(prop => renderGetUniqueValues(prop))
                .filter(line => line)
                .join('\n')}
            return values.ToArray();
        }

        public static Dictionary<string, ${getPk(entity).type.csharpType}> GetUniqueMap(Expression<Func<${entity.className}, bool>> predicate = null)
        {
            Context db = new Context();

            return db.${entity.className}
                .Where(predicate ?? (x => true))
                .Select(p => new {
${generateGetUniqueMapSelect(entity)}
                    p.${getPk(entity).propertyName}
                })
                .ToDictionary(p => string.Join("|", new object[] {
${((entity.uniqueKey || {}).properties || []).map(prop => renderGetUniqueMapStringBuilder(prop))
                .filter(line => line)
                .join('\n')}
                }).ToUpper().Trim(), p => p.${getPk(entity).propertyName});
        }
    }

    public class ${entity.className}Export : CSVExportable
    {
        public int? Key { get; set; }
${entity.Properties.map(prop => renderPropertyInExportClass(prop))
                .filter(line => line)
                .join('\n')}        

        public string GetHeaders()
        {
            var sb = new StringBuilder();
            sb.Append("Key;");
${entity.Properties.map(prop => renderPropertyInGetHeaders(prop))
                .filter(line => line)
                .join('\n')}  
            sb.Append("\\r\\n");
            return sb.ToString();
        }

        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append(Key);
            sb.Append(";");
${entity.Properties.map(prop => renderPropertyInToString(prop))
                .filter(line => line)
                .join('\n')}  
            sb.Append("\\r\\n");
            return sb.ToString();
        }
    }

    public class ${entity.className}ExportSimple : CSVExportable
    {
        public int? Key { get; set; }
${entity.Properties.map(prop => renderPropertyInExportSimpleClass(prop))
                .filter(line => line)
                .join('\n')}        

        public string GetHeaders()
        {
            var sb = new StringBuilder();
            sb.Append("Key;");
${entity.Properties.map(prop => renderPropertyInGetHeadersSimple(prop))
                .filter(line => line)
                .join('\n')}  
            sb.Append("\\r\\n");
            return sb.ToString();
        }

        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append(Key);
            sb.Append(";");
${entity.Properties.map(prop => renderPropertyInToStringSimple(prop))
                .filter(line => line)
                .join('\n')}  
            sb.Append("\\r\\n");
            return sb.ToString();
        }
    }
}`;
    }
}

function generateGetUniqueMapSelect(entity) {
    return ((entity.uniqueKey || {}).properties || [])
        .map(prop => renderGetUniqueMapSelect(prop))
        .filter(line => line)
        .join('\n')
}

function generateUniqueValuesInOrder(entity) {
    // values[1], values[2], values[3], values[6]

    const uniqueValues = generatePropertyInExport(entity)
        .split('\n')
        .filter(line => line)
        .map((line, index) => ({
            isUk: line.includes(' //UNIQUE KEY'),
            value: line.split(' = ')[0].trim(),
            index
        }))
        .filter(line => line.isUk);

    const uniqueValuesInOrder = generateGetUniqueMapSelect(entity)
        .split('\n')
        .filter(line => line)
        .map(line => ({
            value: line.split(' = ')[0].trim().replace(/^_/, ''),
            position: uniqueValues.find(uv => uv.value === line.split(' = ')[0].trim().replace(/^_/, '')).index
        }));

    if (uniqueValues.length != uniqueValuesInOrder.length) {
        console.log(`Tamanhos diferentes de UK [${uniqueValues.length}] [${uniqueValuesInOrder.length}] ${entity.className}`);
    }

    return uniqueValuesInOrder
        .map(line => `values[${line.position + 1}]`)
        .join(', ');
}

function generatePropertyInExport(entity) {
    return entity.Properties.map(prop => renderPropertyInExport(prop))
        .filter(line => line)
        .join('\n');
}

function generatePropertyInExportSimple(entity) {
    return entity.Properties.map(prop => renderPropertyInExportSimple(prop))
        .filter(line => line)
        .join('\n');
}

function generateMapInit(entity) {
    return entity.Properties
        .map(generateMapInitLine)
        .filter(line => line)
        .filter(filterDuplicates)
        .join('\n')
}

function generateMapInitLine(prop) {
    if (!prop.referedEntity) return "";
    return `\t\t\tMap${prop.referedEntity.className} = Interface${prop.referedEntity.className}.GetUniqueMap();`;
}

function generateMapDeclare(entity) {
    return entity.Properties
        .map(generateMapDeclareLine)
        .filter(line => line)
        .filter(filterDuplicates)
        .join('\n')
}

function generateMapDeclareLine(prop) {
    if (!prop.referedEntity) return "";

    const entity = prop.referedEntity;

    return `        private Dictionary<string, ${getPk(entity).type.csharpType}> _map${entity.className};
        public Dictionary<string, ${getPk(entity).type.csharpType}> Map${entity.className}
        {
            get
            {
                if (_map${entity.className} is null)
                    _map${entity.className} = Interface${entity.className}.GetUniqueMap();

                return _map${entity.className};
            }
        }
`;
}

function filterDuplicates(item, pos, arr) {
    return arr.indexOf(item) == pos;
}

function getPk(entity) {
    return entity.Properties.filter(p => p.isPrimaryKey)[0];
}

function getPkName(entity) {
    let pk = getPk(entity)

    if (pk.type.csharpType == 'string') {
        return 'null';
    }

    return `reg.${pk.propertyName}`;
}

function generateGetIdcSelectParamContainer(entity) {
    let params = generateGetIdcSelectParam(entity).replace(/,$/, '');
    params = params ? "\n" + params : "";
    return params;
}

function generateLeftJoin(entity) {
    if (!entity.uniqueKey) return "";

    return entity.uniqueKey.properties
        .map(prop => {
            if (!prop.referedEntity) return "";

            const refTableName = prop.referedEntity.tableName;
            const pk = prop.referedEntity.Properties.filter(p => p.isPrimaryKey)[0].columnName;
            const tableName = prop.entity.tableName;
            const fk = prop.columnName;

            const line = `\t\t\tsb.Append(" LEFT JOIN ${refTableName} ON ${refTableName}.${pk} = ${tableName}.${fk}");`;

            return `${line}\n${generateLeftJoin(prop.referedEntity)}`;
        })
        .filter(line => line)
        .join("\n");
}

function generateGetIdcSelectBody(entity, preffix = "", propOwner = '') {
    if (!entity.uniqueKey) return "";

    return entity.uniqueKey.properties
        .map(prop => {
            if (prop.referedEntity) {
                return generateGetIdcSelectBody(prop.referedEntity, `${preffix ? preffix + '_' : ''}${prop.referedEntity.className}${(prop.suffix || '')}`, `${propOwner}${prop.referedEntity.className}_`);
            }

            return `\t\t\tsb.AppendFormat(" AND ${prop.entity.tableName}.${prop.columnName} = {0} ", ${preffix ? preffix + '_' : ''}${prop.propertyName}${(prop.suffix || '')});`
        })
        .filter(line => line)
        .join("\n")
        .replace(/,$/, ')');
}

function generateGetIdcSelectParam(entity, preffix = "", propOwner = '') {
    if (!entity.uniqueKey) return "";

    return entity.uniqueKey.properties
        .map(prop => {
            if (prop.referedEntity) {
                return generateGetIdcSelectParam(prop.referedEntity, `${preffix ? preffix + '_' : ''}${prop.referedEntity.className}${(prop.suffix || '')}`, `${propOwner}${prop.referedEntity.className}_`)
            }
            return `\t\t\tstring ${preffix ? preffix + '_' : ''}${prop.propertyName}${(prop.suffix || '')},`;
        })
        .filter(line => line)
        .join("\n");
}


function addParameter(properties) {
    const counter = { value: 1 };
    return properties.map(p => genereteAddParameter(p, counter))
        .filter(line => line)
        .join("\n")
        .replace(/,"\);$/, '");')
}

function addParameterMap(properties) {
    const counter = { value: 1 };
    return properties.map(p => genereteAddParameterMap(p, counter))
        .filter(line => line)
        .join("\n")
        .replace(/,"\);$/, '");')
}


function countUk(entity, counter = { count: 0 }) {

    if (!entity.uniqueKey) return counter.count;

    entity.uniqueKey.properties.forEach(ukProp => {
        if (ukProp.referedEntity) {
            countUk(ukProp.referedEntity, counter);
        } else {
            counter.count++;
        }
    });

    return counter.count;
}

function genereteAddParameterMap(prop, counter) {
    if (prop.isPrimaryKey && (!prop.referedEntity)) return;

    let increment = 1;
    let returnValue = '';
    let qtdUk = 0;
    let fk = false;
    let value = `values[${counter.value}]`;

    if (prop.referedEntity) {
        if (!prop.referedEntity.uniqueKey) {
            // console.log(`Tabela ${prop.entity.tableName} referencia a tabela ${prop.referedEntity.tableName} que não possui UK`);
            returnValue = `/* TODO Resolver classe sem UK: reg.${prop.propertyName} */`;
        } else {
            qtdUk = countUk(prop.referedEntity);
            let valueString = new Array(qtdUk)
                .fill(0)
                .map((v, i) => `values[${counter.value + i}]`)
                .join(", ");

            value = `GetIdcInMap(Map${prop.referedEntity.className}, string.Join("|", new object[] { ${valueString} }))`;
            increment += qtdUk - 1;
        }
    }

    value = prop.type.csharpType === 'byte[]' ? `Convert.FromBase64String(${value})` : value;

    if (prop.isNullable) {
        returnValue = `\t\t\t\tcmd.Parameters.Add(pf.CreateParameter("@${prop.columnName}", string.IsNullOrWhiteSpace(values[${counter.value}]) ? DBNull.Value : (object)${value}, DbType.${prop.type.DbType}));`;
    } else {
        returnValue = `\t\t\t\tcmd.Parameters.Add(pf.CreateParameter("@${prop.columnName}", ${value}, DbType.${prop.type.DbType}));`;
    }

    counter.value += increment;
    return returnValue;
}

function genereteAddParameter(prop, counter) {

    if (prop.isPrimaryKey && (!prop.referedEntity)) return;

    if (prop.referedEntity) {
        return generateUkAddParameter(prop, "", "", prop.isNullable, counter);
    };

    if (prop.isNullable) {
        return `\t\t\t\tcmd.Parameters.Add(pf.CreateParameter("@${prop.columnName}", string.IsNullOrWhiteSpace(values[${counter.value}]) ? DBNull.Value : (object)values[${counter.value++}], DbType.${prop.type.DbType}));`;
    } else {
        return `\t\t\t\tcmd.Parameters.Add(pf.CreateParameter("@${prop.columnName}", values[${counter.value++}], DbType.${prop.type.DbType}));`;
    }

}

function genereteAppendValue(prop) {
    if (prop.isPrimaryKey && (!prop.referedEntity)) return;

    if (prop.referedEntity) {
        let params = generateSelectUnique(prop).replace(/",$/, '"');
        params = params ? "\n" + params : "";
        return `\t\t\t\tsql.AppendFormat(" {0},", Interface${prop.referedEntity.className}.GetIdcSelect(${params}));`;
    };

    return `\t\t\t\tsql.Append(" @${prop.columnName},");`
}

function genereteAppendValueMap(prop) {
    if (prop.isPrimaryKey && (!prop.referedEntity)) return;

    return `\t\t\t\tsql.Append(" @${prop.columnName},");`
}

function generateSelectUnique(prop, preffix = "", suffix = "", atLeastOnePropNullable = false) {
    if (!prop.referedEntity.uniqueKey) {
        //console.log(`Tabela ${prop.entity.tableName} referencia a tabela ${prop.referedEntity.tableName} que não possui UK`);
        //return `\n\t\t// TODO Resolver classe sem UK: reg.${prop.propertyName},`;
        return "";
    }

    // Percorre as chaves da tabela referenciada.
    return prop.referedEntity.uniqueKey.properties.map(refProp => {
        if (refProp.referedEntity) {
            return generateSelectUnique(refProp, (preffix ? `${preffix}.` : "") + refProp.entity.className + (prop.suffix || ""), (prop.suffix || suffix), (atLeastOnePropNullable || prop.isNullable));
        }

        return generateUkParam(preffix, prop, refProp, suffix, atLeastOnePropNullable);
    }).filter(line => line).join('\n');
}

function generateUkAddParameter(prop, preffix = "", suffix = "", atLeastOnePropNullable = false, counter) {
    if (!prop.referedEntity.uniqueKey) {
        //console.log(`Tabela ${prop.entity.tableName} referencia a tabela ${prop.referedEntity.tableName} que não possui UK`);
        return `\n\t\t// TODO Resolver classe sem UK: reg.${prop.propertyName},`;
    }

    // Percorre as chaves da tabela referenciada.
    return prop.referedEntity.uniqueKey.properties.map(refProp => {
        if (refProp.referedEntity) {
            return generateUkAddParameter(refProp, (preffix ? `${preffix}.` : "") + refProp.entity.className + (prop.suffix || ""), (prop.suffix || suffix), (atLeastOnePropNullable || prop.isNullable), counter);
        }

        return generateUkAddParameterString(preffix, prop, refProp, suffix, atLeastOnePropNullable, counter);
    }).filter(line => line).join('\n');
}

function generateAppendcolum(prop) {
    if (prop.isPrimaryKey && (!prop.referedEntity)) return;

    return `\t\t\t\tsql.Append(" ${prop.columnName},");`;
}

function renderPropertyInImport(prop) {
    if (prop.isPrimaryKey && (!prop.referedEntity)) {
        return '';
    }

    if (prop.referedEntity) {
        return `\t\t\tentity.${prop.referedEntity.className + (prop.suffix || "")} = (new Interface${prop.referedEntity.className}(db)).GetByUnique(GenDic(dic, new HashSet<string>() { ${renderRecursiveProperties(prop, "", (prop.suffix || ""))} }));`;
    }

    if (["decimal", "bool"].includes(prop.type.csharpType)) {

        if (prop.isNullable && prop.type.nullability === "questionMark") {
            return `\t\t\tentity.${prop.propertyName} = dic["${prop.propertyName}"] is null ? null : (${prop.type.csharpType}?)${prop.type.csharpType}.Parse(dic["${prop.propertyName}"].ToString());`;
        }

        return `\t\t\tentity.${prop.propertyName} = ${prop.type.csharpType}.Parse(dic["${prop.propertyName}"].ToString());`;
    }

    return `\t\t\tentity.${prop.propertyName} = (${prop.type.csharpType})dic["${prop.propertyName}"];`;
}

function renderRecursiveProperties(prop, preffix = "", suffix = "") {
    if (prop.referedEntity && prop.referedEntity.uniqueKey) {
        return prop.referedEntity.uniqueKey.properties
            .map(refProp => renderRecursiveProperties(refProp, preffix + `${refProp.entity.className}_`, suffix))
            .join(", ");
    }

    return `"${preffix}${prop.propertyName}${suffix}"`;
}

function renderUkObjDeclaration(prop, preffix = "", propOwner = '') {
    if (prop.referedEntity && prop.referedEntity.uniqueKey) {
        return prop.referedEntity.uniqueKey.properties.map(refProp => renderUkObjDeclaration(refProp, `${preffix}.${refProp.entity.className}${(prop.suffix || '')}`, `${propOwner}${prop.referedEntity.className}_`))
            .filter(line => line)
            .join("\n");
    }

    const nullIndicator = prop.isNullable && prop.type.nullability === "questionMark" ? "?" : "";

    return `\t\t\t${prop.type.csharpType}${nullIndicator} ${propOwner}${prop.propertyName} = entity${preffix}.${prop.propertyName}${(prop.suffix || '')};`;
}

function renderUkObjWhere(prop, preffix = "", propOwner = '') {
    if (prop.referedEntity && prop.referedEntity.uniqueKey) {
        return prop.referedEntity.uniqueKey.properties.map(refProp => renderUkObjWhere(refProp, `${preffix}.${refProp.entity.className}${(prop.suffix || '')}`, `${propOwner}${prop.referedEntity.className}_`))
            .filter(line => line)
            .join("\n");
    }

    return `\t\t\t\t.Where(item => item${preffix}.${prop.propertyName}${(prop.suffix || '')} == ${propOwner}${prop.propertyName})`;
}

function renderGetUniqueValues(prop, preffix = "", propOwner = '') {

    if (prop.referedEntity && prop.referedEntity.uniqueKey) {
        return prop.referedEntity.uniqueKey.properties.map(refProp => renderGetUniqueValues(refProp, `${preffix}.${refProp.entity.className}${(prop.suffix || '')}`, `${propOwner}${prop.referedEntity.className}_`))
            .filter(line => line)
            .join("\n");
    }

    return `\t\t\tvalues.Add(entity${preffix}.${prop.propertyName}${(prop.suffix || '')});`;
}

function renderGetUniqueMapSelect(prop, preffix = "", suffix = '') {

    if (prop.referedEntity && prop.referedEntity.uniqueKey) {
        return prop.referedEntity.uniqueKey.properties.map(refProp => renderGetUniqueMapSelect(
            refProp,
            `${preffix}.` + refProp.entity.className + (prop.suffix || ""),
            //`${preffix}.${refProp.entity.className}`,
            (suffix || prop.suffix || '')
        )).filter(line => line).join("\n");
    }
    const propName = (`${preffix}.${prop.propertyName}${(suffix || prop.suffix || '')}`).replace(/\./g, "_");
    return `\t\t\t\t\t${propName} = p${preffix}.${prop.propertyName}${(prop.suffix || '')},`;
}

function renderGetUniqueMapStringBuilder(prop, preffix = "", suffix = '') {

    if (prop.referedEntity && prop.referedEntity.uniqueKey) {
        return prop.referedEntity.uniqueKey.properties.map(refProp => renderGetUniqueMapStringBuilder(
            refProp,
            `${preffix}.` + refProp.entity.className + (prop.suffix || ""),
            //`${preffix}.${refProp.entity.className}${(prop.suffix || '')}`
            (suffix || prop.suffix || '')
        )).filter(line => line).join("\n");
    }

    const propName = (`${preffix}.${prop.propertyName}${(suffix || prop.suffix || '')}`).replace(/\./g, "_");
    return `\t\t\t\t\tp.${propName},`;
}

function renderGetUniqueValuesInclude(prop, preffix = "") {

    if (prop.referedEntity && prop.referedEntity.uniqueKey) {
        return prop.referedEntity.uniqueKey.properties.map(refProp => {
            return renderGetUniqueValuesInclude(
                refProp,
                `${preffix ? preffix + '.' : ''}${refProp.entity.className}${(prop.suffix || '')}`
            )
        })
            .filter(line => line)
            .join("\n");
    }

    if (!preffix) return '';

    return `\t\t\t\t.Include("${preffix}")`;
}

function renderUkDicDeclaration(prop, propOwner = '') {

    if (prop.referedEntity && prop.referedEntity.uniqueKey) {
        return prop.referedEntity.uniqueKey.properties.map(p => renderUkDicDeclaration(p, `${propOwner}${prop.referedEntity.className}_`))
            .filter(line => line)
            .join("\n");
    }

    return `\t\t\t${prop.type.csharpType} ${propOwner}${prop.propertyName} = (${prop.type.csharpType})dic.Where(keyValue => keyValue.Key.Contains("${prop.entity.className}") && keyValue.Key.Contains("${prop.propertyName}") && keyValue.Key.Contains(sufixo)).FirstOrDefault().Value;`;
}

function renderUkDicWhere(prop, preffix = "", propOwner = '') {
    if (prop.referedEntity && prop.referedEntity.uniqueKey) {
        return prop.referedEntity.uniqueKey.properties.map(refProp => renderUkDicWhere(refProp, `${preffix}.${refProp.entity.className}${(prop.suffix || '')}`, `${propOwner}${prop.referedEntity.className}_`))
            .filter(line => line)
            .join("\n");
    }

    return `\t\t\t\t.Where(item => item${preffix}.${prop.propertyName}${(prop.suffix || '')} == ${propOwner}${prop.propertyName})`;
}


function renderPropertyInExport(
    prop,
    preffix = "",
    suffix = "",
    atLeastOnePropNullable = false,
    isUk = false,
    level = 1
) {

    if (prop.isPrimaryKey && (!prop.referedEntity)) {
        return '';
    }

    if (!prop.referedEntity) {

        const ukComment = isUk || (prop.isUk && level === 1) ? ' //UNIQUE KEY' : '';

        return `\t\t\t\t\t${prop.propertyName} = reg.${prop.propertyName},${ukComment}`;
    }

    if (!prop.referedEntity.uniqueKey) {
        //console.log(`Tabela ${prop.entity.tableName} referencia a tabela ${prop.referedEntity.tableName} que não possui UK`);
        return `\t\t\t\t\t// TODO Resolver classe sem UK: reg.${prop.propertyName},`;
    }

    // Percorre as chaves da tabela referenciada.
    return prop.referedEntity.uniqueKey.properties.map(refProp => {
        if (refProp.referedEntity) {
            return renderPropertyInExport(
                refProp,
                (preffix ? `${preffix}.` : "") + refProp.entity.className + (prop.suffix || ""),
                (prop.suffix || suffix),
                (atLeastOnePropNullable || prop.isNullable),
                isUk || (prop.isUk && level === 1),
                level + 1
            );
        }

        return generateUkProperty(preffix, prop, refProp, suffix, atLeastOnePropNullable, isUk || (prop.isUk && level === 1));
    }).filter(line => line).join('\n');
}


function renderPropertyInExportSimple(prop) {

    if (prop.isPrimaryKey && (!prop.referedEntity)) {
        return '';
    }

    const ukComment = prop.isUk ? ' //UNIQUE KEY' : '';
    return `\t\t\t\t\t${prop.propertyName} = reg.${prop.propertyName},${ukComment}`;
}

function renderPropertyInExportClass(
    prop,
    preffix = "",
    suffix = "",
    atLeastOnePropNullable = false
) {

    if (prop.isPrimaryKey && (!prop.referedEntity)) {
        return '';
    }

    if (!prop.referedEntity) {
        const questionMark = (atLeastOnePropNullable || prop.isNullable) && prop.type.nullability === "questionMark" ? "?" : "";
        return `\t\tpublic ${prop.type.csharpType}${questionMark} ${prop.propertyName} { get; set; }`;
    }

    if (!prop.referedEntity.uniqueKey) {
        //console.log(`Tabela ${prop.entity.tableName} referencia a tabela ${prop.referedEntity.tableName} que não possui UK`);
        return `\t\t// TODO Resolver classe sem UK: reg.${prop.propertyName},`;
    }

    // Percorre as chaves da tabela referenciada.
    return prop.referedEntity.uniqueKey.properties.map(refProp => {
        if (refProp.referedEntity) {
            return renderPropertyInExportClass(
                refProp,
                (preffix ? `${preffix}.` : "") + refProp.entity.className + (prop.suffix || ""),
                (prop.suffix || suffix),
                (atLeastOnePropNullable || prop.isNullable)
            );
        }

        return generateExportClassProperty(preffix, prop, refProp, suffix, atLeastOnePropNullable);
    }).filter(line => line).join('\n');
}

function renderPropertyInExportSimpleClass(prop) {

    if (prop.isPrimaryKey && (!prop.referedEntity)) {
        return '';
    }

    const questionMark = prop.isNullable && prop.type.nullability === "questionMark" ? "?" : "";
    return `\t\tpublic ${prop.type.csharpType}${questionMark} ${prop.propertyName} { get; set; }`;
}

function renderPropertyInGetHeadersSimple(prop) {
    if (prop.isPrimaryKey && (!prop.referedEntity)) {
        return '';
    }

    return `\t\t\tsb.Append("${prop.propertyName};");`;
}

function renderPropertyInGetHeaders(prop, preffix = "", suffix = "", atLeastOnePropNullable = false) {
    if (prop.isPrimaryKey && (!prop.referedEntity)) {
        return '';
    }

    if (!prop.referedEntity) {
        return `\t\t\tsb.Append("${prop.propertyName};");`;
    }

    if (!prop.referedEntity.uniqueKey) {
        //console.log(`Tabela ${prop.entity.tableName} referencia a tabela ${prop.referedEntity.tableName} que não possui UK`);
        return `\t\t\t// TODO Resolver classe sem UK: reg.${prop.propertyName},`;
    }

    // Percorre as chaves da tabela referenciada.
    return prop.referedEntity.uniqueKey.properties.map(refProp => {
        if (refProp.referedEntity) {
            return renderPropertyInGetHeaders(refProp, (preffix ? `${preffix}.` : "") + refProp.entity.className + (prop.suffix || ""), (prop.suffix || suffix), (atLeastOnePropNullable || prop.isNullable));
        }

        return generateExportGetHeaders(preffix, prop, refProp, suffix, atLeastOnePropNullable);
    }).filter(line => line).join('\n');
}

function renderPropertyInToString(prop, preffix = "", suffix = "", atLeastOnePropNullable = false) {
    if (prop.isPrimaryKey && (!prop.referedEntity)) {
        return '';
    }

    if (!prop.referedEntity) {
        const imgConvertion = prop.type.csharpType === 'byte[]' ? `${prop.propertyName} == null ? "" : Convert.ToBase64String(${prop.propertyName})` : prop.propertyName;

        let ret = "";
        ret += `\t\t\tsb.Append(${imgConvertion});\n`;
        ret += '\t\t\tsb.Append(";");'
        return ret;
    }

    if (!prop.referedEntity.uniqueKey) {
        //console.log(`Tabela ${prop.entity.tableName} referencia a tabela ${prop.referedEntity.tableName} que não possui UK`);
        return `\t\t\t// TODO Resolver classe sem UK: reg.${prop.propertyName},`;
    }

    // Percorre as chaves da tabela referenciada.
    return prop.referedEntity.uniqueKey.properties.map(refProp => {
        if (refProp.referedEntity) {
            return renderPropertyInToString(refProp, (preffix ? `${preffix}.` : "") + refProp.entity.className + (prop.suffix || ""), (prop.suffix || suffix), (atLeastOnePropNullable || prop.isNullable));
        }

        return generateExportToString(preffix, prop, refProp, suffix, atLeastOnePropNullable);
    }).filter(line => line).join('\n');
}

function renderPropertyInToStringSimple(prop) {
    if (prop.isPrimaryKey && (!prop.referedEntity)) {
        return '';
    }

    const imgConvertion = prop.type.csharpType === 'byte[]' ? `${prop.propertyName} == null ? "" : Convert.ToBase64String(${prop.propertyName})` : prop.propertyName;

    let ret = "";
    ret += `\t\t\tsb.Append(${imgConvertion});\n`;
    ret += '\t\t\tsb.Append(";");'
    return ret;
}

function generateUkProperty(preffix, prop, refProp, suffix, atLeastOnePropNullable, isUk) {
    let ret = "";
    ret += "\t\t\t\t\t";
    ret += preffix ? `${preffix.replace(/\./g, "_")}_` : "";
    ret += prop.referedEntity.className + (prop.suffix || '') + "_";
    ret += refProp.propertyName + (prop.suffix || '') + suffix + " = ";
    ret += (prop.isNullable || atLeastOnePropNullable) && refProp.type.nullability === "questionMark" ? `(${refProp.type.csharpType}?) ` : "";
    ret += `reg.${preffix ? `${preffix}.` : ""}`;
    ret += prop.referedEntity.className + (prop.suffix || '') + ".";
    ret += refProp.propertyName + ",";
    ret += isUk ? ' //UNIQUE KEY' : '';

    return ret;
}

function generateExportClassProperty(preffix, prop, refProp, suffix, atLeastOnePropNullable) {
    let ret = "";
    ret += "\t\tpublic ";
    ret += refProp.type.csharpType
    ret += (refProp.isNullable || prop.isNullable || atLeastOnePropNullable) && refProp.type.nullability === "questionMark" ? "?" : "";
    ret += " ";
    ret += preffix ? `${preffix.replace(/\./g, "_")}_` : "";
    ret += prop.referedEntity.className + (prop.suffix || '') + "_";
    ret += refProp.propertyName + (prop.suffix || '') + suffix;
    ret += " { get; set; }";
    return ret;
}

function generateUkParam(preffix, prop, refProp, suffix, atLeastOnePropNullable) {
    let ret = "";
    ret += '\t\t\t\t\t"@';
    ret += preffix ? `${preffix.replace(/\./g, "_")}_` : "";
    ret += prop.referedEntity.className + "_";
    ret += refProp.propertyName + (prop.suffix || '') + suffix;
    ret += '",';
    return ret;
}

function generateUkAddParameterString(preffix, prop, refProp, suffix, atLeastOnePropNullable, counter) {
    let ret = "";
    ret += preffix ? `${preffix.replace(/\./g, "_")}_` : "";
    ret += prop.referedEntity.className + "_";
    ret += refProp.propertyName + (prop.suffix || '') + suffix;

    if (atLeastOnePropNullable) {
        return `\t\t\t\tcmd.Parameters.Add(pf.CreateParameter("@${ret}", string.IsNullOrWhiteSpace(values[${counter.value}]) ? DBNull.Value : (object)values[${counter.value++}], DbType.${refProp.type.DbType}));`;;
    } else {
        return `\t\t\t\tcmd.Parameters.Add(pf.CreateParameter("@${ret}", values[${counter.value++}], DbType.${refProp.type.DbType}));`;;
    }
}

function generateExportGetHeaders(preffix, prop, refProp, suffix, atLeastOnePropNullable) {
    let ret = "";
    ret += '\t\t\tsb.Append("';
    ret += preffix ? `${preffix.replace(/\./g, "_")}_` : "";
    ret += prop.referedEntity.className + "_";
    ret += refProp.propertyName + (prop.suffix || '') + suffix;
    ret += ';");';
    return ret;
}

function generateExportToString(preffix, prop, refProp, suffix, atLeastOnePropNullable) {
    let ret = "";
    ret += '\t\t\tsb.Append(';
    ret += preffix ? `${preffix.replace(/\./g, "_")}_` : "";
    ret += prop.referedEntity.className + (prop.suffix || '') + "_";
    ret += refProp.propertyName + (prop.suffix || '') + suffix;
    ret += ');\n';
    ret += '\t\t\tsb.Append(";");'
    return ret;
}