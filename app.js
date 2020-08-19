'use strict';

const express = require('express'); 
const app = express();

var path = require('path');
const bodyParser = require('body-parser');

app.use(express.json());
app.use(express.static('/'));

const serveFileFromRoot = (res, relativePath) => 
    res.sendFile(path.join(`${__dirname}/${relativePath}`));

const serveHome = (_, res) => serveFileFromRoot(res, 'index.html');
const serveData = (_, res) => serveFileFromRoot(res, 'data.json');
const serveFavicon = (_, res) => serveFileFromRoot(res, 'favicon.ico');

// routes
app.get('/', serveHome);
app.get('/data', serveData);
app.get('/favicon.ico', serveFavicon);

const port = process.env.PORT || 1111;

app.listen(port, () =>
    console.log(`visual-d3 server listening at http://localhost:${port}/`)
);
