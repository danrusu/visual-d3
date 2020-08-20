'use strict';

const express = require('express'); 
const app = express();

const path = require('path');
const { updateData } = require('./data-update.js');

app.use(express.json());
app.use(express.static('public'));
app.use('/data', express.static('data'));

const serveFileFromRoot = (res, relativePath) => 
    res.sendFile(path.join(`${__dirname}/${relativePath}`));

const serveHome = (_, res) => serveFileFromRoot(res, 'index.html');

// routes
app.get('/', serveHome);
app.put('/data/:dataType', updateData);

const port = process.env.PORT || 1111;
const notifyServerStart = () =>
    console.log(`Express server listening at http://localhost:${port}/`);

app.listen(port, notifyServerStart);
