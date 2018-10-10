module.exports = function (namespace) {
    return function (entity) {
        return `namespace ${namespace}
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;

    [Table("${entity.tableName}")]
    public partial class ${entity.className}
    {        
        public const string TABLE_NAME = "${entity.tableName}";

${entity.Properties.reduce(renderConstants, []).join('\n')}
        
        public ${entity.className}()
        {
${entity.outRelations.map(renderOutRelationInit).join('\n')}
        }

${entity.Properties.map(renderProperty).join('\n\n')}

${entity.inRelations.map(renderInRelation).join('\n\n')}

${entity.outRelations.map(renderOutRelation).join('\n\n')}
    }
}`;
    }
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