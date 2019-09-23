const psList = require('ps-list');
const os = require('os');
const isDev = require('electron-is-dev');
const { join } = require('path');
const { spawn, exec } = require('child_process');

const TREZOR_PROCESS_NAME = 'trezord';
const STATUS = { OK: 'ok', ERROR: 'error' };

const error = msg => {
    throw new Error(`cannot run bridge library - ${msg}`);
};

const getBridgeVersion = () => {
    return '2.0.27';
};

const getArch = () => {
    const arch = os.arch();
    switch (arch) {
        case 'x32':
            return 'x32';
        case 'x64':
            return 'x64';
        default:
            error('unsupported system architecture');
    }
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
            error('unsupported OS');
    }
};

const getBridgeLibByOs = () => {
    const os = getOS();
    const arch = getArch();
    const bridgeVersion = getBridgeVersion();
    const filePath = `static/bridge/${bridgeVersion}`;
    const prefixedFilePath = isDev ? filePath : `build/${filePath}`;
    const bridgeStaticFolder = join(__dirname, `../${prefixedFilePath}`);

    switch (os) {
        case 'mac':
            return join(bridgeStaticFolder, `trezord-mac`);
        case 'linux':
            return join(bridgeStaticFolder, `trezord-linux-${arch}`);
        case 'win':
            return join(bridgeStaticFolder, `trezord-win.exe`);
        default:
            error(`cannot find library`);
    }
};

const spawnProcess = command => {
    const spawnedProcess = spawn(command, [], {
        detached: true,
    });
    spawnedProcess.on('error', err => {
        error(err);
    });
};

const execute = command => {
    exec(command, (error, stdout, stderr) => {
        if (error) {
            error(error);
            return;
        }
        error(`${stderr}`);
    });
};

const isBridgeRunning = async () => {
    const processes = await psList();
    const isRunning = processes.find(ps => ps.name.includes(TREZOR_PROCESS_NAME));
    return isRunning;
};

const runBridgeProcess = async () => {
    const os = getOS();
    const arch = getArch();
    const isBridgeAlreadyRunning = await isBridgeRunning();

    // bridge is already installed and running, nothing to do
    if (isBridgeAlreadyRunning) {
        return { status: STATUS.OK };
    }

    const lib = getBridgeLibByOs();
    spawnProcess(lib);
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
