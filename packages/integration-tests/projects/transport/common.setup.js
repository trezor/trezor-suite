const { Controller } = require('../../websocket-client');

const wait = ms =>
    new Promise(resolve => {
        setTimeout(resolve, ms);
    });

global.Trezor = {
    wait,
    Controller,
};
