const psList = require('ps-list');
const os = require('os');
const { join } = require('path');
const { exec } = require('child_process');

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
    const bridgeStaticFolder = `../static/bridge/${bridgeVersion}`;

    switch (os) {
        case 'mac':
            return join(bridgeStaticFolder, `trezor-bridge-${bridgeVersion}.pkg`);
        case 'linux':
            return join(bridgeStaticFolder, `trezor-bridge_${bridgeVersion}_amd64.deb`);
        case 'win':
            return join(bridgeStaticFolder, `trezor-bridge_${bridgeVersion}-win32-install.exe`);
        default:
            return `Cannot run bridge lib on unknown os "${os}"`;
    }
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

const runBridge = async () => {
    const os = getOS();
    const isBridgeAlreadyRunning = await isBridgeRunning();

    // bridge is already installed, nothing to do
    if (isBridgeAlreadyRunning) {
        return { status: STATUS.OK };
    }

    if (!isBridgeAlreadyRunning) {
        const lib = getBridgeLibByOs();

        if (os === 'mac') {
            console.log('running bridge on mac OS');
            execute(`sudo installer -pkg ${lib} -target /`);
        }

        if (os === 'linux') {
            console.log('running bridge on linux');
        }

        if (os === 'win') {
            console.log('running bridge on win');
        }

        return {
            status: STATUS.ERROR,
            message: `Cannot run bridge os "${os}"`,
        };
    }
};

runBridge();

export { isBridgeRunning, runBridge };
