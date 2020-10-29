import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import isDev from 'electron-is-dev';
import { RESOURCES } from '../constants';

export type Status = {
    service: boolean;
    process: boolean;
};

class BaseProcess {
    process: ChildProcess | null;
    resourceName: string;
    processName: string;
    startupCooldown: number;
    stopKillWait: number;
    startupThrottle: ReturnType<typeof setTimeout> | null;
    supportedSystems = ['linux-x64', 'mac-x64', 'win-x64'];

    /**
     * @param resourceName Resource folder name
     * @param processName Process name (without extension)
     * @param startupCooldown Cooldown before being able to run start again (seconds)
     * @param stopKillWait How long to wait before killing the process on stop (seconds)
     */
    constructor(resourceName = '', processName = '', startupCooldown = 0, stopKillWait = 10) {
        this.process = null;
        this.startupThrottle = null;
        this.resourceName = resourceName;
        this.processName = processName;
        this.startupCooldown = startupCooldown;
        this.stopKillWait = stopKillWait;
    }

    /**
     * Returns the status of the service/process
     * - service: The service is working
     * - process: The process is running
     */
    async status() {
        return {
            service: false,
            process: false,
        };
    }

    /**
     * Start the bundled process
     * @param params Command line parameters for the process
     */
    async start(params: string[] = []) {
        if (this.startupThrottle) {
            return;
        }

        const { process, service } = await this.status();

        // Service is running, nothing to do
        if (service) {
            return;
        }

        // If the process is running but the service isn't
        if (process) {
            // Stop the process
            await this.stop();
        }

        // Throttle process start
        if (this.startupCooldown > 0) {
            this.startupThrottle = setTimeout(() => {
                this.startupThrottle = null;
            }, this.startupCooldown * 1000);
        }

        const { system, ext } = this.getPlatformInfo();
        if (!this.isSystemSupported(system)) {
            throw new Error(`[${this.resourceName}] unsupported system (${system})`);
        }

        const processPath = path.join(
            RESOURCES,
            'bin',
            this.resourceName,
            isDev ? system : '',
            `${this.processName}${ext}`,
        );
        this.process = spawn(processPath, params);
    }

    /**
     * Stops the process
     */
    stop() {
        return new Promise(resolve => {
            if (!this.process) {
                resolve();
                return;
            }

            this.process.kill();

            let timeout = 0;
            const interval = setInterval(() => {
                if (!this.process || this.process.killed) {
                    clearInterval(interval);
                    this.process = null;
                    resolve();
                    return;
                }

                if (timeout >= this.stopKillWait) {
                    this.process.kill('SIGKILL');
                } else {
                    timeout++;
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
