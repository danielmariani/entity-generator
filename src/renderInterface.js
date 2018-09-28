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
        public object Export()
        {
            return db.${entity.className}
                .Select(
                reg => new
                {
${entity.Properties.map(renderPropertyInExport)
                .filter(line => line)
                .join('\n')}
                }).ToList();
        }

        public partial class Filtros : FiltrosParent
        {

        }
    }
}`;
    }
}

function renderPropertyInExport(prop) {


    if (prop.isPrimaryKey) {
        return '';
    }

    if (!prop.referedEntity) {
        return `\t\t\t\t\treg.${prop.propertyName},`;
    }

    if (!prop.referedEntity.uniqueKey) {
        // console.log(`Tabela ${prop.entity.tableName} referencia a tabela ${prop.referedEntity.tableName} que não possui UK`);
        return `\t\t\t\t\t// TODO Resolver classe sem UK: reg.${prop.propertyName},`;
    }

    // Percorre as chaves da tabela referenciada.
    return prop.referedEntity.uniqueKey.properties.map(refProp => {
        if (refProp.referedEntity) {
            // return `\t\t\t\t\treg.${prop.referedEntity.className}.${refProp.referedEntity.className},`
            return '';
        }

        if (prop.isNullable) {
            if (refProp.type.nullability === "questionMark") {
                return `\t\t\t\t\t${prop.referedEntity.className}_${refProp.propertyName + (prop.suffix || '')} = (${refProp.type.csharpType}?) reg.${prop.referedEntity.className + (prop.suffix || '')}.${refProp.propertyName},`;
            } else {
                return `\t\t\t\t\t${prop.referedEntity.className}_${refProp.propertyName + (prop.suffix || '')} = reg.${prop.referedEntity.className + (prop.suffix || '')}.${refProp.propertyName},`;
                // return `\t\t\t\t\t${refProp.propertyName} = reg.${prop.propertyName} != null ? reg.${prop.referedEntity.className}.${refProp.propertyName} : null,`;
            }
        }

        return `\t\t\t\t\t${prop.referedEntity.className}_${refProp.propertyName + (prop.suffix || '')} = reg.${prop.referedEntity.className + (prop.suffix || '')}.${refProp.propertyName},`;
    }).filter(line => line).join('\n');
}

function renderConstants(constants, property) {

    if (!property.listOfValues) return constants;

    constants = constants.concat(property.listOfValues.map(value => {
        const quotedValue = property.type.csharpType === "string" ? `"${value.code}"` : value.code;
        return `\t\tpublic const ${property.type.csharpType} ${property.constantName + "_" + value.constantName} = ${quotedValue};`;
    }));

    return constants;
}

function renderProperty(c) {
    return [
        `${c.isPrimaryKey ? '[Key]' : ''}`,
        `${c.isIdentity ? '[DatabaseGenerated(DatabaseGeneratedOption.Identity)]' : `${c.isPrimaryKey ? '[DatabaseGenerated(DatabaseGeneratedOption.None)]' : ''}`}`,
        `${!c.isNullable && c.type.nullability === 'annotation' ? '[Required]' : ''}`,
        `${c.type.lengthInfo && c.size > 0 ? `[${c.type.lengthInfo}(${c.size})]` : ''}`,
        `[Column("${c.columnName}"${c.type.typeName ? `, TypeName = "${c.type.typeName}"` : ''}${c.order ? `, Order = ${c.order - 1}` : ''})]`,
        `public ${c.type.csharpType}${c.isNullable && c.type.nullability === 'questionMark' ? '?' : ''} ${c.propertyName} { get; set; }`
    ].filter(line => line)
        .map(line => '\t\t' + line)
        .join('\n');
}

function renderInRelation(r) {
    return [
        `[ForeignKey("${r.column}")]`,
        `public virtual ${r.refClass} ${r.refProp} { get; set; }`
    ].map(line => '\t\t' + line)
        .join('\n');
}

function renderOutRelation(r) {
    return [
        `[ForeignKey("${r.column}")]`,
        `public virtual ICollection<${r.class}> List${r.prop} { get; set; }`
    ].map(line => '\t\t' + line)
        .join('\n');
}

function renderOutRelationInit(r) {
    return `\t\t\tList${r.prop} = new HashSet<${r.class}>();`;
}