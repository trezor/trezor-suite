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
        controller.on('firmwares', ({ T1, TT }) => {
            let firmware;
            if (!firmwareArg || firmwareArg === '2-latest') {
                [firmware] = TT.filter(fw => !fw.includes('-'));
            } else if (firmwareArg === '1-latest') {
                [firmware] = T1.filter(fw => !fw.includes('-'));
            } else {
                firmware = T1.find(fw => fw === firmwareArg) || TT.find(fw => fw === firmwareArg);
            }

            if (!firmware) {
                reject(new Error(`Unknown firmware: ${firmwareArg}`));
            }

            resolve(firmware);
        });
        controller.connect().catch(reject);
    });

const success = fw => {
    if (!fw) {
        throw new Error('Latest FW version not found');
    }

    process.stdout.write(fw);
    process.exit();
};

const load = () => {
    if (tries > 60) {
        throw new Error('trezor-user-env not found');
    }
    tries++;
    setTimeout(
        () => {
            getLatestFirmware().then(success).catch(load);
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
