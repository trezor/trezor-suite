const psList = require('ps-list');
const os = require('os');

const TREZOR_PROCESS_NAME = 'trezord';

const getOS = () => {
    const platform = os.platform();
    switch (platform) {
        case 'aix':
        case 'freebsd':
        case 'linux':
        case 'openbsd':
        case 'android':
            return 'linux';
        case 'darwin':
        case 'sunos':
            return 'mac';
        case 'win32':
            return 'win';
        default:
            return 'cannot run bridge on unsupported OS';
    }
};

const isBridgeRunning = async () => {
    const processes = await psList();
    const isRunning = processes.find(ps => ps.name.includes(TREZOR_PROCESS_NAME));
    return isRunning;
};

const run = async () => {
    const isBridgeAlreadyRunning = await isBridgeRunning();
    const os = getOS();

    console.log({ os, isBridgeAlreadyRunning });

    if (isBridgeAlreadyRunning) {
        return true;
    }

    // bridge is not running, run
    if (!isBridgeAlreadyRunning) {
        // run bridge on mac os
        if (os === 'mac') {
            console.log('running bridge on mac OS');
        }

        // run bridge on linux
        if (os === 'linux') {
            console.log('running bridge on linux');
        }

        // run bridge on windows
        if (os === 'win') {
            console.log('running bridge on win');
        }
    }
};

run();
