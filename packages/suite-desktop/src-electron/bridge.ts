import psList from 'ps-list';
import * as os from 'os';
// import * as fs from 'fs';
import isDev from 'electron-is-dev';
import { join } from 'path';
import { spawn, exec } from 'child_process';

const TREZOR_PROCESS_NAME = 'trezord';
const res = isDev ? './public/static' : process.resourcesPath;

const error = (msg: string | Error) => {
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
        case 'linux':
            return 'linux';
        case 'darwin':
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
    const filePath = `bridge/${bridgeVersion}`;

    switch (os) {
        case 'mac':
            return join(res, filePath, `trezord-mac`);
        case 'linux':
            return join(res, filePath, `trezord-linux-${arch}`);
        case 'win':
            return join(res, filePath, `trezord-win.exe`);
        default:
            error(`cannot find library`);
    }
};

const spawnProcess = (command: string, args: string[] = []) => {
    const spawnedProcess = spawn(command, args, {
        detached: true,
        // stdio: [process.stdin, process.stdout, process.stderr], // do not pipe stdio. pipe needs to be flushed from time to time
        stdio: ['ignore', 'ignore', 'ignore'],
    });
    spawnedProcess.on('error', err => {
        error(err);
    });
};

const execute = (command: string) => {
    exec(command, (error, _stdout, stderr) => {
        if (error) {
            console.error(error);
            return;
        }
        console.log(`${stderr}`);
    });
};

export const isBridgeRunning = async () => {
    const processes = await psList();
    // TODO: ps-list version 7.2.0 started to include full path (at least in a dev env) in process.name, the name is even truncated to 15 chars thus find below fails
    const bridgeProcess = processes.find(ps => ps.name.includes(TREZOR_PROCESS_NAME));
    return bridgeProcess;
};

export const runBridgeProcess = async (devMode?: boolean) => {
    const bridgeProcess = await isBridgeRunning();
    if (bridgeProcess) {
        process.kill(bridgeProcess.pid);
    }

    const lib = getBridgeLibByOs();
    const args = devMode ? ['-e', '21324'] : [];
    if (lib) {
        spawnProcess(lib, args);
    }
};

export const killBridgeProcess = async () => {
    const processes = await psList();
    const bridgeProcess = processes.find(ps => ps.name.includes(TREZOR_PROCESS_NAME));
    if (bridgeProcess) {
        execute(`kill -9 ${bridgeProcess.pid}`);
    }
};
