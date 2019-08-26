const psList = require('ps-list');
const os = require('os');
const { join } = require('path');
const { spawn, exec } = require('child_process');

const TREZOR_PROCESS_NAME = 'trezord';
const STATUS = { OK: 'ok', ERROR: 'error' };

const getBridgeVersion = () => {
    return '2.0.27'; // TODO: should not be hardcoded
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

const getBridgeLibByOs = () => {
    const os = getOS();
    const bridgeVersion = getBridgeVersion();
    const bridgeStaticFolder = `./static/bridge/${bridgeVersion}`;

    switch (os) {
        case 'mac':
        case 'linux':
            return join(bridgeStaticFolder, `trezord`);
        case 'win':
            return 'TODO'; // TODO get bridge lib for windows
        default:
            return `Cannot run bridge lib on unknown os "${os}"`;
    }
};

const spawnProcess = command => {
    spawn(command, [], {
        detached: true,
    });
};

const execute = command => {
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
    });
};

const isBridgeRunning = async () => {
    const processes = await psList();
    const isRunning = processes.find(ps => ps.name.includes(TREZOR_PROCESS_NAME));
    return isRunning;
};

const runBridgeProcess = async () => {
    const os = getOS();
    const isBridgeAlreadyRunning = await isBridgeRunning();

    // bridge is already installed and running, nothing to do
    if (isBridgeAlreadyRunning) {
        console.log('bridge is already running');
        return { status: STATUS.OK };
    }

    // bridge is not installed, run as process in electron app
    if (!isBridgeAlreadyRunning) {
        const lib = getBridgeLibByOs();
        console.log(`bridge is not running, starting bridge for ${os}`);

        if (os === 'mac' || os === 'linux') {
            spawnProcess(lib);
        }

        if (os === 'win') {
            console.log('running bridge on win');
        }
    }
};

const killBridgeProcess = async () => {
    const processes = await psList();
    const bridgeProcess = processes.find(ps => ps.name.includes(TREZOR_PROCESS_NAME));
    execute(`kill -9 ${bridgeProcess.pid}`);
};

module.exports = {
    isBridgeRunning,
    runBridgeProcess,
    killBridgeProcess,
};
