const psList = require('ps-list');
const os = require('os');
const { exec } = require('child_process');

const TREZOR_PROCESS_NAME = 'trezord';
const STATUS = { OK: 'ok', ERROR: 'error' };

const getBridgeVersion = () => {
    return '2.0.27';
};

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
            return 'Cannot run bridge on unsupported OS';
    }
};

const getBridgeLiByOs = () => {
    const os = getOS();
    const bridgeVersion = getBridgeVersion();
    switch (os) {
        case 'mac':
            return `../static/bridge/trezor-bridge_${bridgeVersion}.pkg`;
        case 'linux':
            return `../static/bridge/trezor-bridge_${bridgeVersion}_amd64.deb`;
        case 'win':
            return `../static/bridge/trezor-bridge_${bridgeVersion}-win32-install`;
        default:
            return `Cannot run bridge lib on unknown os "${os}"`;
    }
};

const isBridgeRunning = async () => {
    const processes = await psList();
    const isRunning = processes.find(ps => ps.name.includes(TREZOR_PROCESS_NAME));
    return isRunning;
};

const run = async () => {
    const os = getOS();
    const isBridgeAlreadyRunning = await isBridgeRunning();

    // bridge is already installed, nothing to do
    if (isBridgeAlreadyRunning) {
        return { status: STATUS.OK };
    }

    // bridge is not running, run
    if (!isBridgeAlreadyRunning) {
        const lib = getBridgeLiByOs();

        // run bridge on mac os
        if (os === 'mac') {
            console.log('running bridge on mac OS');
            exec(lib);
        }

        // run bridge on linux
        if (os === 'linux') {
            console.log('running bridge on linux');
            exec(lib);
        }

        // run bridge on windows
        if (os === 'win') {
            console.log('running bridge on win');
            exec(lib);
        }

        return {
            status: STATUS.ERROR,
            message: `Cannot run bridge os "${os}"`,
        };
    }
};

const result = run();
