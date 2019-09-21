'use strict';

const express = require('express');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

function launchChromeAndRunLighthouse(url, opts, config = null) {
    return chromeLauncher.launch({chromeFlags: opts.chromeFlags}).then(chrome => {
        opts.port = chrome.port;
        return lighthouse(url, opts, config).then(results => {
            return chrome.kill().then(() => results.lhr)
        });
    });
}

const opts = {
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
};

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// App
let running = false;
const app = express();
app.get('/', (req, res) => {
    if(running) {
        return res.status(503).json({
            error: 'Lighthouse is already running, try again shortly'
        });
    }

    const url = req.query.url

    if(! url) {
        return res.status(400).json({
            error: 'Missing url parameter'
        });
    }

    running = true;

    launchChromeAndRunLighthouse(url, opts)
        .then(results => res.json(results))
        .catch(exception => res.status(500).send(exception))
        .finally(() => { running = false; });
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
