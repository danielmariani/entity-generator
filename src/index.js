#! /usr/bin/env node
process.chdir('../PostoFacil.DataAcces');
const util = require('util');
const fs = require('fs');
const pdmInfo = require('pdm-to-json');
const writeFile = util.promisify(fs.writeFile);
const Entity = require('./entity');
const Schema = require('./schema');
const convertConnectionString = require('./connectionstring');
const renderFactory = require('./render');
const renderInterfaceFactory = require('./renderInterface');
const getConfig = require('./config');
const renderContextFactory = require('./renderContext');
const csprojLoader = require('./csprojLoader');

getConfig().then(config => {

    const renderContext = renderContextFactory(config.sourceName, config.namespace);
    const render = renderFactory(config.namespace);
    const renderInterface = renderInterfaceFactory(config.namespace);
    const entitiesFolder = config.entitiesFolder;
    const impExpFolder = config.impExpFolder;
    const connectionstring = convertConnectionString(config.source);
    const schema = new Schema(connectionstring);

    console.log('Conectando ao banco de dados...');

    schema
        .getSchemas()
        .then(generate)
        .then(r => console.log('Arquivos gerados!'));

    function generate(result) {

        return pdmInfo(config.pdmFile).then(info => {

            // Cria entidades
            const entities = result.map(t => new Entity(t, info));

            // Atualiza FKs e UKs nas entidades
            updateEntityReferences(entities);

            console.log('Gerando arquivo Context...');
            const retornoContext = writeFile('Context.cs', renderContext(entities));

            // Gerando arquivos de entidade
            const retornoEntidades = entities.map(e => {
                //console.log(`Gerando arquivo ${e.className}.cs`);
                return writeFile(`${entitiesFolder || '.'}/${e.className}.cs`, render(e));
            });

            //Gerando arquivos de Interface
            const tablesToImport = getTablesToImport();
            const tablesToNotImport = getTablesToNotImport();
            const retornoImpExp = entities

                // // Apenas as tabelas:
                // .filter(e => tablesToImport
                // .find(tb => tb === e.tableName))

                // // Exceto as tabelas:
                // .filter(e => tablesToNotImport
                // .find(tb => tb !== e.tableName))

                .map(e => {
                    //console.log(`Gerando arquivo Interface${e.className}.cs`);
                    return writeFile(`${impExpFolder || '.'}/Interface${e.className}.cs`, renderInterface(e));
                });

            console.log('Reescrevendo project file');
            const retornoProj = csprojLoader(config.projectFile, entities, config.entitiesFolder);

            return Promise.all([
                retornoImpExp,
                retornoProj,
                retornoContext,
                ...retornoEntidades
            ]);
        });

    }

    function updateEntityReferences(entities) {
        // Cria FKs nas entidades
        entities.forEach(entity => {

            // Add Foreigh Key reference
            entity.Properties
                .filter(prop => prop.referedEntity)
                .forEach(prop => {
                    var referedEntity = entities.find(e => e.tableName === prop.referedEntity.tableName);
                    prop.referedEntity = referedEntity;
                });
        });
    }
    function getTablesToNotImport() {
        return [
            'CTR_ENCERRANTE',
            'REG_ANOMALIA',
            'EVT_BASE',
            'CAD_IMAGEM',
            'CAD_TURNO'
        ];
    }

    function getTablesToImport() {
        // var a = [];
        // a.push('REG_TURNO');
        // a.push('REG_TURNO_BLOCO_MEDIDOR');

        // return a;

        return [
            'REG_TURNO',
            'REG_TURNO_BLOCO_MEDIDOR',
            'REG_TURNO_TANQUE_POSTO',
            'REG_TURNO_FECHAMENTO',
            'REG_RATEIO',
            'REL_RATEIO_CENTRO_CUSTO',
            'REG_CARGA_MASSA',
            'REG_ABASTECIMENTO',
            'REG_ABASTECIMENTO_TANQUE',
            'REG_REC_CAMINHAO_TANQUE',
            'REG_REC_CHEGADA_EXTERNA_CAMINHAO_TANQUE',
            // 'REG_REC_COMPARTIMENTO_CAMINHAO_TANQUE',
            'REG_REC_COMPLEMENTO_CAMINHAO_TANQUE',
            'REG_REC_AMOSTRAGEM_CAMINHAO_TANQUE',
            'REG_REC_BLOCO_MEDIDOR_CAMINHAO_TANQUE',
            'REG_REC_TANQUE_POSTO_CAMINHAO_TANQUE',
            'REG_MOVIMENTACAO_POSTO_MOVEL',
            'REG_BLOCO_MEDIDOR_TROCA',
            'REG_BLOCO_MEDIDOR_RESET',
            'REG_BLOCO_MEDIDOR_AFERICAO',
            'REG_BLOQUEIO_BLOCO_MEDIDOR',
            'HST_TURNO',
            'HST_TURNO_BLOCO_MEDIDOR',
            'HST_TURNO_TANQUE_POSTO',
            'HST_ABASTECIMENTO',
            'HST_ABASTECIMENTO_TANQUE',
            // 'HST_REC_CAMINHAO_TANQUE',
            // 'HST_REC_CHEGADA_EXTERNA_CAMINHAO_TANQUE',
            // 'HST_REC_COMPARTIMENTO_CAMINHAO_TANQUE',
            // 'HST_REC_COMPLEMENTO_CAMINHAO_TANQUE',
            // 'HST_REC_AMOSTRAGEM_CAMINHAO_TANQUE',
            // 'HST_REC_BLOCO_MEDIDOR_CAMINHAO_TANQUE',
            // 'HST_REC_TANQUE_POSTO_CAMINHAO_TANQUE',
            'HST_MOVIMENTACAO_POSTO_MOVEL',
            'HST_BLOCO_MEDIDOR_AFERICAO',
            'HST_EQUIPAMENTO',
            'HST_TANQUE_EQUIPAMENTO',
            'HST_REL_TANQUE_EQUIPAMENTO_PRODUTO',
            'HST_POSTO',
            'HST_TANQUE_POSTO',
            'HST_BLOCO_MEDIDOR',
            'HST_REL_TANQUE_BLOCO_MEDIDOR',
            'HST_USUARIO',
            'CTR_ENVIO_ERP',
            // 'CTR_ENCERRANTE',
            'CTR_HOR_HOD',
            // 'REG_ANOMALIA'
        ];
    }

}).catch(console.log);