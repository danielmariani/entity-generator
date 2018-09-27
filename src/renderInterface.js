//@ts-check

module.exports = function (namespace) {
    return function (entity, schema) {
        return `namespace ${namespace}
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;

    [Table("${entity.tableName}")]
    public partial class Interface${entity.className} : InterfaceDataAccess<${entity.className}, Interface${entity.className}.Filtros>
    {
        public Interface${entity.className}()
        {
        }

        public Interface${entity.className}(Context db) : base(db)
        {
        }

        public override ${entity.className} Create(${entity.className} entidade)
        {
            db.${entity.className}.Add(entidade);
            db.SaveChanges();
            return entidade;
        }
        
        public override IEnumerable<${entity.className}> Retrieve(Filtros filtros)
        {            
            var retorno = db.${entity.className}.ToList();
            return retorno;
        }
        
        public override ${entity.className} Update(${entity.className} entidade)
        {
            db.${entity.className}.Attach(entidade);
            db.Entry(entidade).State = System.Data.Entity.EntityState.Modified;
            db.SaveChanges();
            return entidade;
        }
        
        public override ${entity.className} Delete(int id)
        {
            ${entity.className} entidade = db.${entity.className}.Find(id);
            db.${entity.className}.Remove(entidade);
            db.SaveChanges();
            return entidade;
        }
        
        public object Export()
        {
            return db.${entity.className}
                .Select(
                reg => new
                {${entity.Properties.map(renderPropertyInExport).join('\n')}
                }).ToList();
        }
        
        public class Filtros : FiltrosParent
        {
        }
    }
}`;
    }
}

function renderPropertyInExport(prop) {
    var str = '';

    if (prop.isPrimaryKey){
        return '';
    }

    if (!prop.referedEntity){
        return `reg.${prop.propertyName},`;
    }

    if (!prop.referedEntity.uniqueKey){
        console.log(`Tabela ${prop.entity.tableName} referencia a tabela ${prop.referedEntity.tableName} que não possui UK`);
        return `// reg.${prop.propertyName},`;
    }

    // Percorre as chaves da tabela referenciada.
    return prop.referedEntity.uniqueKey.properties.map(refProp => {
        `reg.${prop.propertyName}.${refProp.propertyName},`
    }).join('\n');

    // return [
    //     `${prop.isPrimaryKey ? '' : `reg.${prop.propertyName},`}`

    //     // `${c.isIdentity ? '[DatabaseGenerated(DatabaseGeneratedOption.Identity)]' : `${c.isPrimaryKey ? '[DatabaseGenerated(DatabaseGeneratedOption.None)]' : ''}`}`,
    //     // `${!c.isNullable && c.type.nullability === 'annotation' ? '[Required]' : ''}`,
    //     // `${c.type.lengthInfo && c.size > 0 ? `[${c.type.lengthInfo}(${c.size})]` : ''}`,
    //     // `[Column("${c.columnName}"${c.type.typeName ? `, TypeName = "${c.type.typeName}"` : ''}${c.order ? `, Order = ${c.order - 1}` : ''})]`,
    //     // `public ${c.type.csharpType}${c.isNullable && c.type.nullability === 'questionMark' ? '?' : ''} ${c.propertyName} { get; set; }`
    // ].filter(line => line)
    //     .map(line => '\t\t\t' + line)
    //     .join('\n');
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