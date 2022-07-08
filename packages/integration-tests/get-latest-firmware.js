const { Controller } = require('./websocket-client');

const firmwareArg = process.env.TESTS_FIRMWARE || '2-latest';
let tries = 0;

// This script should be called before `yarn ${TEST_SCRIPT}`
// - Trying to connect to trezor-user-env multiple times (trezor-user-env preloading)
// - Get latest possible version from trezor-user-env
// - Validate if requested FW version is available in trezor-user-env

const getLatestFirmware = () =>
    new Promise((resolve, reject) => {
        const controller = new Controller();
        controller.on('error', error => {
            reject(error);
        });
        controller.on('firmwares', res => {
            if (!res['1'] || !res['2'] || !res.R) {
                return reject(new Error('unexpected response in firmwares event'));
            }
            let firmware;
            if (!firmwareArg || firmwareArg === '2-latest') {
                [firmware] = res['2'].filter(fw => !fw.includes('-'));
            } else if (firmwareArg === '1-latest') {
                [firmware] = res['1'].filter(fw => !fw.includes('-'));
                // todo: 3-latest? r-latest? we will see
            } else {
                firmware =
                    res['1'].find(fw => fw === firmwareArg) ||
                    res['2'].find(fw => fw === firmwareArg);
            }

            if (!firmware) {
                reject(new Error(`Unknown firmware: ${firmwareArg}`));
            }

            resolve(firmware);
        });
        controller.connect().catch(reject);
    });

const writeOut = fw => {
    process.stdout.write(fw);
    process.exit();
};

const load = () => {
    if (tries > 60) {
        return getLatestFirmware().then(writeOut).catch(writeOut);
    }
    tries++;
    setTimeout(
        () => {
            getLatestFirmware().then(writeOut).catch(load);
        },
        tries > 1 ? 1000 : 0,
    );
};

// consume all unexpected outputs
Object.keys(console).forEach(k => {
    if (typeof console[k] === 'function') {
        console[k] = () => {};
    }
});
process.on('uncaughtException', err => {
    throw err;
});

load();
