'use strict';

const path = require('path');
const fetch = require('node-fetch');
const { readFile, writeFile, readdir, unlink } = require('fs');
const { promisify } = require('util');
const [ read, write, readDir, deleteFile ] = [ readFile, writeFile, readdir, unlink ].map(promisify);

const prettify = json => JSON.stringify(json, null, 2);

const NO_OF_LOCATIONS = {
    '1K': 1,
    '100K': 100,
    '250K': 250,
    '500K': 500,
    '1M': 1000,
    '4M': 4000,
    '5M': 5000,
};

const formatWorkflowData = workflowData => {
    const {date, noOfLocations, duration} = workflowData;
    return {
        name: `_${date.replace(/-/g, '_')}`,
        noOfLocations: NO_OF_LOCATIONS[noOfLocations],
        duration: duration.ms
    };
}

const saveWorkflowData = async (workflowData, dataType) => {

   // validate workflowData.type vs. dataType

   if (! Object.keys(NO_OF_LOCATIONS).includes(workflowData.noOfLocations)){
       const errorMessage = `Wrong noOfLocations: ${workflowData.noOfLocations}. Not saved!`;       
       console.log(errorMessage);
       return `${errorMessage}\nValid noOfLocations: ${prettify(NO_OF_LOCATIONS)}`
   }

   const dataFilePath = path.join(`${__dirname}/data/${dataType}.json`);

    const formatedWorkflowData = formatWorkflowData(workflowData);
    console.log(`formatedWorkflowData: ${prettify(formatedWorkflowData)}`);
    const { name, noOfLocations, duration } = formatedWorkflowData;

    const data = JSON.parse(await read(dataFilePath));
    const currentData = data.graphData;
    const groupNameIndex = currentData.findIndex(group => group.name === name);

    if (groupNameIndex > -1){
        const values = currentData[groupNameIndex].values;
        const noOfLocationsIndex = values.findIndex(value => value.noOfLocations === noOfLocations);
        
        if (noOfLocationsIndex > -1){
            values[noOfLocationsIndex].duration = duration;
        }
        else {
            values.push({ noOfLocations, duration });            
        }
        values.sort((v1, v2) => v1.noOfLocations < v2.noOfLocations ? -1 : 1);
    }
    else{
        currentData.push({ 
            name,
            values: [ { noOfLocations, duration } ]
        });        
    }
    console.log(prettify(currentData));

    data.graphData = currentData;
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
}

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
    
    const workflowData = req.body;
    console.log(`Received ${dataType} workflow data: ${prettify(workflowData)}`);

    const errorMessage = await saveWorkflowData(workflowData, dataType);
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
    createData, 
    updateData,
    deleteData
};