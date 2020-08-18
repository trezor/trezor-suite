import psList from 'ps-list';
import * as os from 'os';
import isDev from 'electron-is-dev';
import { join } from 'path';
import { spawn, exec } from 'child_process';

const TREZOR_PROCESS_NAME = 'trezord';
const STATUS = { OK: 'ok', ERROR: 'error' };

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
    const prefixedFilePath = isDev ? `public/${filePath}` : `build/${filePath}`;
    const bridgeStaticPath = join(__dirname, `../${prefixedFilePath}`);
    // bridge binaries need to be unpacked from asar archive otherwise spawning the bridge process won't work
    const bridgeStaticFolder = isDev
        ? bridgeStaticPath
        : bridgeStaticPath.replace('app.asar', 'app.asar.unpacked');

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
    // TODO: ps-list version 7.2.0 started to include full path (at least in a dev env) to a name which is even truncated at 15 chars thus find fails
    const bridgeProcess = processes.find(ps => ps.name.includes(TREZOR_PROCESS_NAME));
    return bridgeProcess;
};

export const runBridgeProcess = async (devMode?: boolean) => {
    const bridgeProcess = await isBridgeRunning();
    if (bridgeProcess) {
        process.kill(bridgeProcess.pid);
    }
    // if (bridgeProcess) {
    //     if (devMode !== undefined) {
    //         // toggling dev mode, kill bridges
    //         process.kill(bridgeProcess.pid);
    //     } else {
    //         // bridge is already installed and running, nothing to do
    //         return { status: STATUS.OK };
    //     }
    // }

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
