import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import isDev from 'electron-is-dev';
import { RESOURCES } from '../constants';

export type Status = {
    service: boolean;
    process: boolean;
};

/**
 * [startupCooldown] Cooldown before being able to run start again (seconds).
 * [stopKillWait] How long to wait before killing the process on stop (seconds).
 * [autoRestart] Seconds to wait before auto-restarting the process (seconds). 0 = off.
 */
export type Options = {
    startupCooldown?: number;
    stopKillWait?: number;
    autoRestart?: number;
};

const defaultOptions: Options = {
    startupCooldown: 0,
    stopKillWait: 10,
    autoRestart: 2,
};

abstract class BaseProcess {
    process: ChildProcess | null;
    resourceName: string;
    processName: string;
    options: Options;
    startupThrottle: ReturnType<typeof setTimeout> | null;
    supportedSystems = ['linux-arm64', 'linux-x64', 'mac-x64', 'win-x64'];
    stopped = false;

    /**
     * @param resourceName Resource folder name
     * @param processName Process name (without extension)
     * @param options Additional options
     */
    constructor(resourceName = '', processName = '', options = defaultOptions) {
        this.process = null;
        this.startupThrottle = null;
        this.resourceName = resourceName;
        this.processName = processName;
        this.options = {
            ...defaultOptions,
            ...options,
        };
    }

    /**
     * Returns the status of the service/process
     * - service: The service is working
     * - process: The process is running
     */
    abstract status(): Promise<{ service: boolean; process: boolean }>;

    /**
     * Start the bundled process
     * @param params Command line parameters for the process
     */
    async start(params: string[] = []) {
        if (this.startupThrottle) {
            return;
        }

        const status = await this.status();

        // Service is running, nothing to do
        if (status.service) {
            return;
        }

        // If the process is running but the service isn't
        if (status.process) {
            // Stop the process
            await this.stop();
        }

        // Throttle process start
        if (this.options.startupCooldown && this.options.startupCooldown > 0) {
            this.startupThrottle = setTimeout(() => {
                this.startupThrottle = null;
            }, this.options.startupCooldown * 1000);
        }

        const { system, ext } = this.getPlatformInfo();
        if (!this.isSystemSupported(system)) {
            throw new Error(`[${this.resourceName}] unsupported system (${system})`);
        }

        this.stopped = false;

        const processDir = path.join(RESOURCES, 'bin', this.resourceName, isDev ? system : '');
        const processPath = path.join(processDir, `${this.processName}${ext}`);
        const processEnv = { ...process.env };
        // library search path for macOS
        processEnv.DYLD_LIBRARY_PATH = processEnv.DYLD_LIBRARY_PATH
            ? `${processEnv.DYLD_LIBRARY_PATH}:${processDir}`
            : `${processDir}`;
        // library search path for Linux
        processEnv.LD_LIBRARY_PATH = processEnv.LD_LIBRARY_PATH
            ? `${processEnv.LD_LIBRARY_PATH}:${processDir}`
            : `${processDir}`;
        this.process = spawn(processPath, params, {
            cwd: processDir,
            env: processEnv,
        });
        this.process.on('error', err => this.onError(err));
        this.process.on('exit', () => this.onExit());
    }

    /**
     * Stops the process
     */
    stop() {
        return new Promise(resolve => {
            if (!this.process) {
                this.stopped = true;
                resolve();
                return;
            }

            this.process.kill();

            let timeout = 0;
            const interval = setInterval(() => {
                if (!this.process || this.process.killed) {
                    clearInterval(interval);
                    this.process = null;
                    this.stopped = true;
                    resolve();
                    return;
                }

                if (this.options.stopKillWait && timeout < this.options.stopKillWait) {
                    timeout++;
                } else {
                    this.process.kill('SIGKILL');
                }
            }, 1000);
        });
    }

    /**
     * Restart the process
     * @param force Force the restart
     */
    async restart() {
        await this.stop();
        await this.start();
    }

    onError(err: Error) {
        console.error('ERROR', this.processName, err);
    }

    onExit() {
        this.process = null;
        if (this.options.autoRestart && this.options.autoRestart > 0 && !this.stopped) {
            setTimeout(() => this.start(), this.options.autoRestart * 1000);
        }
    }

    ///
    isSystemSupported(system: string) {
        return this.supportedSystems.includes(system);
    }

    getPlatformInfo() {
        const { arch } = process;
        const platform = this.getPlatform();
        const ext = platform === 'win' ? '.exe' : '';
        const system = `${platform}-${arch}`;
        return { system, platform, arch, ext };
    }

    getPlatform() {
        switch (process.platform) {
            case 'darwin':
                return 'mac';
            case 'win32':
                return 'win';
            default:
                return process.platform;
        }
    }
}

export default BaseProcess;
