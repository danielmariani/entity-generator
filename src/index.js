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
            const retornoImpExp = entities.map(e => {
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
            // // Add Unique key reference
            // if (entity.uniqueKey){
            //     entity.uniqueKey.columns = entity.uniqueKey.columns.map(col => {
            //         var referedTable = entities.find(e => e.tableName === col.TABLE_NAME);
            //         var referedColumn = referedTable.Properties.find(p => p.columnName === col.COLUMN_NAME);
            //         return referedColumn;
            //     });
            // }

            // Add Foreigh Key reference
            entity.Properties
                .filter(prop => prop.referedEntity)
                .forEach(prop => {
                    var referedEntity = entities.find(e => e.tableName === prop.referedEntity.tableName);
                    prop.referedEntity = referedEntity;
                });
        });
    }

}).catch(console.log);