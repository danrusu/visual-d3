'use strict';

const express = require('express'); 
const app = express();
const { readFile, writeFile } = require('fs');
const { promisify } = require('util');
const [ read, write ] = [ readFile, writeFile ].map(promisify);

var path = require('path');
const bodyParser = require('body-parser');
const { group } = require('console');

app.use(express.json());
app.use(express.static('public'));
app.use('/data', express.static('data'));

const DATA_TYPES = ['import', 'accumulation'];
const prettify = json => JSON.stringify(json, null, 2);

const serveFileFromRoot = (res, relativePath) => 
    res.sendFile(path.join(`${__dirname}/${relativePath}`));

const serveHome = (_, res) => serveFileFromRoot(res, 'index.html');

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
       console.log(`Wrong nr. of locations: ${workflowData.noOfLocations}. Not saved!`);
       return;
   }

   const dataFilePath = path.join(`${__dirname}/data/${dataType}.json`);

    const formatedWorkflowData = formatWorkflowData(workflowData);
    console.log(`formatedWorkflowData: ${prettify(formatedWorkflowData)}`);
    const { name, noOfLocations, duration } = formatedWorkflowData;

    const currentData = JSON.parse(await read(dataFilePath));
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

    await write(dataFilePath, prettify(currentData));
};

const updateData = (req, res) => {
    const dataType = req.params.dataType;
    
    if (! DATA_TYPES.includes(dataType)){
        res.status(404).send(`Wrong dataType! Only ${DATA_TYPES} are accepted`);
        return;
    }

    if (req.headers['content-type'] !== 'application/json'){ 
        res.status(406).send('Only JSON is supported!');
        return;
    }
    
    const workflowData = req.body;
    console.log(`Received ${dataType} workflow data: ${prettify(workflowData)}`);

    saveWorkflowData(workflowData, dataType);

    res.status(202).send(`${dataType} upload success`);
};

// routes
app.get('/', serveHome);
app.put('/data/:dataType', updateData);

const port = process.env.PORT || 1111;

app.listen(port, () =>
    console.log(`Express server listening at http://localhost:${port}   `)
);
