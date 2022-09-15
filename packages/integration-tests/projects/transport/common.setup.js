const { Controller } = require('../../../trezor-user-env-link');

const wait = ms =>
    new Promise(resolve => {
        setTimeout(resolve, ms);
    });

global.Trezor = {
    wait,
    Controller,
};
