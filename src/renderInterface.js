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
        return `\t\t\tentity.${prop.referedEntity.className} = (new Interface${prop.referedEntity.className}()).GetByUnique(GenDic(dic, new HashSet<string>() { ${renderRecursiveProperties(prop)} }));`;
    }

    return `\t\t\tentity.${prop.propertyName} = (${prop.type.csharpType})dic["${prop.propertyName}"];`;
}

function renderRecursiveProperties(prop) {
    // "CadPosto_CadUnidade_CadComplexo_CadDiretoria_SglDiretoria", "CadPosto_CadUnidade_CadComplexo_SglComplexo", "CadPosto_CadUnidade_SglUnidade", "CadPosto_SglPosto"

    if (prop.referedEntity) {
        return renderRecursiveProperties(prop);
    }

    return `"${prop.propertyName}"`;
}

// entity.CadPosto = (new InterfaceCadPosto()).GetByUnique(GenDic(dic, new HashSet<string>() {  }));
// entity.CadUsuario = (new InterfaceCadUsuario()).GetByUnique(GenDic(dic, new HashSet<string>() { "CadUsuario_CodUsuario" }));
// entity.CadEquipamento = (new InterfaceCadEquipamento()).GetByUnique(GenDic(dic, new HashSet<string>() { "CadEquipamento_CodTagPlaca", "CadEquipamento_CadComplexo_CadDiretoria_SglDiretoria", "CadEquipamento_CadComplexo_SglComplexo" }));
// entity.RegTurno = (new InterfaceRegTurno()).GetByUnique(GenDic(dic, new HashSet<string>() { "RegTurno_DthInicial", "RegTurno_CadPosto_CadUnidade_CadComplexo_CadDiretoria_SglDiretoria", "RegTurno_CadPosto_CadUnidade_CadComplexo_SglComplexo", "RegTurno_CadPosto_CadUnidade_SglUnidade", "RegTurno_CadPosto_SglPosto" }));
// entity.CadCentroCusto = (new InterfaceCadCentroCusto()).GetByUnique(GenDic(dic, new HashSet<string>() { "CadCentroCusto_CodCentroCusto" }));
// entity.CadOrdemEstatistica = (new InterfaceCadOrdemEstatistica()).GetByUnique(GenDic(dic, new HashSet<string>() { "CadOrdemEstatistica_CodOrdemEstatistica" }));
// entity.CadElementoPep = (new InterfaceCadElementoPep()).GetByUnique(GenDic(dic, new HashSet<string>() { "CadElementoPep_CodElementoPep" }));
// entity.CadEmpresa = (new InterfaceCadEmpresa()).GetByUnique(GenDic(dic, new HashSet<string>() { "CadEmpresa_CnpjEmpresa" }));
// entity.CadContrato = (new InterfaceCadContrato()).GetByUnique(GenDic(dic, new HashSet<string>() { "CadContrato_CodContrato" }));
// entity.CadGri = (new InterfaceCadGri()).GetByUnique(GenDic(dic, new HashSet<string>() { "CadGri_CodGri" }));
// entity.CadTipoFiscal = (new InterfaceCadTipoFiscal()).GetByUnique(GenDic(dic, new HashSet<string>() { "CadTipoFiscal_DscTipoFiscal" }));
// entity.DthInicial = (DateTime)dic["DthInicial"];
// entity.DthFinal = (DateTime)dic["DthFinal"];
// entity.ValHorHod = (decimal)dic["ValHorHod"];
// entity.ChkResetAutomaticoHorHod = (bool)dic["ChkResetAutomaticoHorHod"];
// entity.ChkHorimetro = dic["ChkHorimetro"] is null ? null : (bool?)dic["ChkHorimetro"];
// entity.SglGerenciaGa = (string)dic["SglGerenciaGa"];
// entity.NomDispositivo = (string)dic["NomDispositivo"];
// entity.DthCriacaoReg = (DateTime)dic["DthCriacaoReg"];
// entity.StuAbastecimento = (string)dic["StuAbastecimento"];
// entity.TransferenciaProduto = (new InterfaceTransferenciaProduto()).GetByUnique(GenDic(dic, new HashSet<string>() { "TransferenciaProduto_DataHoraUTCInicioRetiradaOrigem" }));


function renderUkObjWhere(prop, preffix = "") {
    if (prop.referedEntity && prop.referedEntity.uniqueKey) {
        return prop.referedEntity.uniqueKey.properties.map(refProp => renderUkObjWhere(refProp, `${preffix}.${refProp.entity.className}`))
            .filter(line => line)
            .join("\n");
    }

    return `\t\t\t\t.Where(item => item${preffix}.${prop.propertyName} == entity${preffix}.${prop.propertyName})`;
}

function renderUkDicWhere(prop, preffix = "") {
    if (prop.referedEntity && prop.referedEntity.uniqueKey) {
        return prop.referedEntity.uniqueKey.properties.map(refProp => renderUkDicWhere(refProp, `${preffix}.${refProp.entity.className}`))
            .filter(line => line)
            .join("\n");
    }

    return `\t\t\t\t.Where(item => item${preffix}.${prop.propertyName} == ${prop.propertyName})`;
}

function renderUkDicDeclaration(prop) {

    if (prop.referedEntity && prop.referedEntity.uniqueKey) {
        return prop.referedEntity.uniqueKey.properties.map(renderUkDicDeclaration)
            .filter(line => line)
            .join("\n");
    }

    return `\t\t\t${prop.type.csharpType} ${prop.propertyName} = (${prop.type.csharpType})dic.Where(keyValue => keyValue.Key.Contains("${prop.entity.className}") && keyValue.Key.Contains("${prop.propertyName}") && keyValue.Key.Contains(sufixo)).FirstOrDefault().Value;`;
}

function renderPropertyInExport(prop, preffix = "", suffix = "") {
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
            return renderPropertyInExport(refProp, (preffix ? `${preffix}.` : "") + refProp.entity.className + (prop.suffix || ""), (prop.suffix || suffix));
        }

        return generateUkProperty(preffix, prop, refProp, suffix);
    }).filter(line => line).join('\n');
}

function generateUkProperty(preffix, prop, refProp, suffix) {
    let ret = "";
    ret += "\t\t\t\t\t";
    ret += preffix ? `${preffix.replace(/\./g, "_")}_` : "";
    ret += prop.referedEntity.className + "_";
    ret += refProp.propertyName + (prop.suffix || '') + suffix + " = ";
    ret += prop.isNullable && refProp.type.nullability === "questionMark" ? `(${refProp.type.csharpType}?) ` : "";
    ret += `reg.${preffix ? `${preffix}.` : ""}`;
    ret += prop.referedEntity.className + (prop.suffix || '') + ".";
    ret += refProp.propertyName + ",";

    return ret;
}