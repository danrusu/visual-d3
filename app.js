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
const serveImportData = (_, res) => serveFileFromRoot(res, 'import.json');
const serveAccumulationData = (_, res) => serveFileFromRoot(res, 'accumulation.json');
const serveFavicon = (_, res) => serveFileFromRoot(res, 'favicon.ico');
const serveMainCss = (_, res) => serveFileFromRoot(res, 'main.css');

// routes
app.get('/', serveHome);
app.get('/import', serveImportData);
app.get('/accumulation', serveAccumulationData);
app.get('/favicon.ico', serveFavicon);
app.get('/main.css', serveMainCss);

const port = process.env.PORT || 1111;

app.listen(port, () =>
    console.log(`visual-d3 server listening at http://localhost:${port}/`)
);
