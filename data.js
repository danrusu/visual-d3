'use strict';

const path = require('path');
const fetch = require('node-fetch');
const { readFile, writeFile, readdir, unlink } = require('fs');
const { promisify } = require('util');
const [ read, write, readDir, deleteFile ] = [ readFile, writeFile, readdir, unlink ].map(promisify);

const prettify = json => JSON.stringify(json, null, 2);

const saveData = async (dataToSave, dataType) => {
    const { name, x, y } = dataToSave;
    const data = await getData(dataType);
    const xExpectedValues = data.graphSettings.xExpectedValues;

    if (! xExpectedValues.includes(x)){
        const errorMessage = `Wrong x value: ${x}. Not saved!`;
        console.log(errorMessage);
        return `${errorMessage}\nValid x values: ${prettify(xExpectedValues)}`
    }

    console.log(`dataToSave: ${prettify(dataToSave)}`);
    
    const currentData = data.graphData;
    const groupNameIndex = currentData.findIndex(series => series.name === name);

    if (groupNameIndex > -1){
        const values = currentData[groupNameIndex].values;
        const xIndex = values.findIndex(value => value.x === x);
        
        if (xIndex > -1){
            values[xIndex].y = y;
        }
        else {
            values.push({ x, y });            
        }
        values.sort((v1, v2) => v1.x - v2.x > 0 ? -1 : 1);
    }
    else{
        currentData.push({ 
            name,
            values: [ { x, y } ]
        });        
    }    

    data.graphData = currentData;
    const dataFilePath = path.join(`${__dirname}/data/${dataType}.json`);
    await write(dataFilePath, prettify(data));
};

const getDataTypes = async (_, res) => {
    const dataTypes = await getSortedFileNames('data');    
    res.status(200).send(dataTypes);
};

const getSortedFileNames = async folderPath => {
    const files = await readDir(folderPath);
    return files
        .map(fileName => fileName.replace(/\.json/, ''))
        .sort();
};

const getXExpectedValues = async (req, res) => {
    const dataTypes = await getSortedFileNames('data');
    const dataType = req.params.dataType;
    
    if (! dataTypes.includes(dataType)){
        res.status(406).send(`Wrong dataType! Only ${dataTypes} are accepted`);
        return;
    }

    const data = await getData(dataType);    
    res.status(200).send(data.graphSettings.xExpectedValues);
};

const getData = async dataType => JSON.parse(await read(`data/${dataType}.json`));

const updateData = async (req, res) => {
    const dataTypes = await getSortedFileNames('data');
    const dataType = req.params.dataType;
    
    if (! dataTypes.includes(dataType)){
        res.status(406).send(`Wrong dataType! Only ${dataTypes} are accepted`);
        return; 
    }

    if (req.headers['content-type'] !== 'application/json'){    
        res.status(406).send('Only JSON is supported!');
        return;
    }
    
    const dataToSave = req.body;
    console.log(`Received data: ${prettify(dataToSave)}`);

    const errorMessage = await saveData(dataToSave, dataType);
    if (errorMessage){
        res.status(406).send(errorMessage);
        return;
    }

    res.status(202).send(`${dataType} upload success`);
};

const createData = async (req, res) => {
    const dataTypes = await getSortedFileNames('data');
    const dataType = req.params.dataType;

    if (dataTypes.includes(dataType)){
        res.status(406).send(`Cannot create '${dataType}'. It already exists.`);
        return;
    }

    if (req.headers['content-type'] !== 'application/json'){    
        res.status(406).send('Only JSON is supported!');
        return;
    }

    const data = req.body;

    await write(`data/${dataType}.json`, prettify(data));
    res.status(200).send(`Created ${dataType}.`);
};

const deleteData = async (req, res) => {
    const dataTypes = await getSortedFileNames('data')
    const dataType = req.params.dataType;

    if (! dataTypes.includes(dataType)){
        res.status(404).send(`Cannot delete '${dataType}'.`);
        return;
    }

    await deleteFile(`data/${dataType}.json`);
    res.status(200).send(`Deleted ${dataType}.`);
};

module.exports = { 
    getDataTypes, 
    getXExpectedValues,
    createData, 
    updateData,
    deleteData
};