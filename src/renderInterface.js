//@ts-check

module.exports = function (namespace) {
    return function (entity, schema) {
        return `namespace ${namespace}.Interfaces
{
    using System;
    using System.Linq;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;

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

        public object Export()
        {
            return db.${entity.className}
                .Select(
                reg => new
                {
${entity.Properties.map(prop => renderPropertyInExport(prop))
                .filter(line => line)
                .join('\n')}
                }).ToList();
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

            return db.${entity.className}
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

            return db.${entity.className}
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
    }
}`;
    }
}

function renderPropertyInImport(prop) {
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
        return prop.referedEntity.uniqueKey.properties.map(refProp => renderUkObjDeclaration(refProp, `${preffix}.${refProp.entity.className}${(prop.suffix||'')}`,`${propOwner}${prop.referedEntity.className}_`))
            .filter(line => line)
            .join("\n");
    }

    const nullIndicator = prop.isNullable && prop.type.nullability === "questionMark" ? "?" : "";

    return `\t\t\t${prop.type.csharpType}${nullIndicator} ${propOwner}${prop.propertyName} = entity${preffix}.${prop.propertyName}${(prop.suffix||'')};`;
}

function renderUkObjWhere(prop, preffix = "",propOwner = '') {
    if (prop.referedEntity && prop.referedEntity.uniqueKey) {
        return prop.referedEntity.uniqueKey.properties.map(refProp => renderUkObjWhere(refProp, `${preffix}.${refProp.entity.className}${(prop.suffix||'')}`,`${propOwner}${prop.referedEntity.className}_`))
            .filter(line => line)
            .join("\n");
    }

    return `\t\t\t\t.Where(item => item${preffix}.${prop.propertyName}${(prop.suffix||'')} == ${propOwner}${prop.propertyName})`;
}

function renderUkDicDeclaration(prop, propOwner = '') {

    if (prop.referedEntity && prop.referedEntity.uniqueKey) {
        return prop.referedEntity.uniqueKey.properties.map(p => renderUkDicDeclaration(p,`${propOwner}${prop.referedEntity.className}_`))
            .filter(line => line)
            .join("\n");
    }

    return `\t\t\t${prop.type.csharpType} ${propOwner}${prop.propertyName} = (${prop.type.csharpType})dic.Where(keyValue => keyValue.Key.Contains("${prop.entity.className}") && keyValue.Key.Contains("${prop.propertyName}") && keyValue.Key.Contains(sufixo)).FirstOrDefault().Value;`;
}

function renderUkDicWhere(prop, preffix = "",propOwner = '') {
    if (prop.referedEntity && prop.referedEntity.uniqueKey) {
        return prop.referedEntity.uniqueKey.properties.map(refProp => renderUkDicWhere(refProp, `${preffix}.${refProp.entity.className}${(prop.suffix||'')}`,`${propOwner}${prop.referedEntity.className}_`))
            .filter(line => line)
            .join("\n");
    }

    return `\t\t\t\t.Where(item => item${preffix}.${prop.propertyName}${(prop.suffix||'')} == ${propOwner}${prop.propertyName})`;
}


function renderPropertyInExport(prop, preffix = "", suffix = "", atLeastOnePropNullable = false) {
    if (prop.isPrimaryKey) {
        return '';
    }

    if (!prop.referedEntity) {
        return `\t\t\t\t\treg.${prop.propertyName},`;
    }

    if (!prop.referedEntity.uniqueKey) {
        console.log(`Tabela ${prop.entity.tableName} referencia a tabela ${prop.referedEntity.tableName} que não possui UK`);
        return `\t\t\t\t\t// TODO Resolver classe sem UK: reg.${prop.propertyName},`;
    }

    // Percorre as chaves da tabela referenciada.
    return prop.referedEntity.uniqueKey.properties.map(refProp => {
        if (refProp.referedEntity) {
            return renderPropertyInExport(refProp, (preffix ? `${preffix}.` : "") + refProp.entity.className + (prop.suffix || ""), (prop.suffix || suffix), (atLeastOnePropNullable || prop.isNullable));
        }

        return generateUkProperty(preffix, prop, refProp, suffix, atLeastOnePropNullable);
    }).filter(line => line).join('\n');
}

function generateUkProperty(preffix, prop, refProp, suffix, atLeastOnePropNullable) {
    let ret = "";
    ret += "\t\t\t\t\t";
    ret += preffix ? `${preffix.replace(/\./g, "_")}_` : "";
    ret += prop.referedEntity.className + "_";
    ret += refProp.propertyName + (prop.suffix || '') + suffix + " = ";
    ret += (prop.isNullable || atLeastOnePropNullable) && refProp.type.nullability === "questionMark" ? `(${refProp.type.csharpType}?) ` : "";
    ret += `reg.${preffix ? `${preffix}.` : ""}`;
    ret += prop.referedEntity.className + (prop.suffix || '') + ".";
    ret += refProp.propertyName + ",";

    return ret;
}