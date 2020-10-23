import psList from 'ps-list';
import * as os from 'os';
// import * as fs from 'fs';
import isDev from 'electron-is-dev';
import { join } from 'path';
import { spawn, exec } from 'child_process';

const TREZOR_PROCESS_NAME = 'trezord';
const res = isDev ? './public/static' : process.resourcesPath;

const error = (msg: string | Error) => {
    throw new Error(`cannot run bridge binary - ${msg}`);
};

const getPlatformArchExt = () => {
    let platform = os.platform().toString();
    if (platform === 'darwin') platform = 'mac';
    if (platform === 'win32') platform = 'win';
    const arch = os.arch();
    const ext = platform === 'win' ? '.exe' : '';
    const system = `${platform}-${arch}`;
    const supportedSystems = ['linux-x64', 'mac-x64', 'win-x64'];
    if (supportedSystems.includes(system)) {
        return [platform, arch, ext];
    }
    error(`unsupported system ${platform} ${arch}`);
};

const getBridgeBinBySystem = () => {
    const sys = getPlatformArchExt();
    if (sys) {
        const [platform, arch, ext] = sys;
        return join(res, 'bridge', `trezord-${platform}-${arch}${ext}`);
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

    const bin = getBridgeBinBySystem();
    const args = devMode ? ['-e', '21324'] : [];
    if (bin) {
        spawnProcess(bin, args);
    }
};

export const killBridgeProcess = async () => {
    const processes = await psList();
    const bridgeProcess = processes.find(ps => ps.name.includes(TREZOR_PROCESS_NAME));
    if (bridgeProcess) {
        execute(`kill -9 ${bridgeProcess.pid}`);
    }
};
