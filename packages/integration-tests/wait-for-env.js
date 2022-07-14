/* eslint-disable no-await-in-loop,no-async-promise-executor */

const fetch = require('cross-fetch');
const { Controller } = require('./websocket-client');

const controller = new Controller();

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const filterFirmwares = firmwares => {
    const firmwareArg = process.env.TESTS_FIRMWARE;
    const latest2 = firmwares['2'].find(fw => !fw.includes('-'));

    if (firmwareArg === '2-latest') {
        return latest2;
    }
    if (firmwareArg === '1-latest') {
        return firmwares['1'].filter(fw => !fw.includes('-'));
    }
    return firmwareArg || latest2;
};

const writeOut = data => {
    process.stdout.write(data);
};

const wait = async () => {
    try {
        await new Promise(async resolve => {
            const limit = 60;
            let error = '';
            process.stderr.write('waiting for trezor-user-env');

            for (let i = 0; i < limit; i++) {
                if (i === limit - 1) {
                    process.stderr.write(`cant connect to trezor-user-env: ${error.message}\n`);
                }
                await delay(1000);

                try {
                    const res = await fetch('http://localhost:9002');
                    if (res.status === 200) {
                        break;
                    }
                } catch (err) {
                    error = err;
                    process.stderr.write('.');
                }
            }

            resolve();
        });

        process.stderr.write('\ntrezor-user-env: ready');

        const res = await controller.connect();
        const firmware = filterFirmwares(res);
        // translate 'n-latest' into specific fw number
        if (process.env.TESTS_FIRMWARE !== firmware) {
            writeOut(firmware);
        } else {
            writeOut(process.env.TESTS_FIRMWARE);
        }
    } catch (err) {
        process.stderr.write(JSON.stringify(err));
        process.exit(1);
    }
    process.exit(0);
};

// consume all unexpected outputs so that they do not go to stdout
Object.keys(console).forEach(k => {
    if (typeof console[k] === 'function') {
        console[k] = () => {};
    }
});

wait();
