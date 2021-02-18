#!/usr/bin/env node

// Fetches content of a first opened GitHub issue labeled "Release Changelog"

const fetch = require('node-fetch');

fetch('https://api.github.com/repos/trezor/trezor-suite/issues?labels=Release%20Changelog')
    .then(response => response.json())
    .then(data => {
        console.log(data[0].body);
    })
    .catch(() => console.log('Changelog issue not found'));
