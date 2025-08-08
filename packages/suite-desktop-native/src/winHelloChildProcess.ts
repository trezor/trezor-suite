import fs from 'fs';
import * as os from 'os';
import path from 'path';

import type { IPCRequest, IPCResponse } from './types';
import type * as WinHelloTypes from './win_hello.d';

const errorMessageToStandardError = (errorMessage: string) => {
    switch (errorMessage) {
        case 'Canceled':
            return 'Authentication canceled.';
        default:
            return errorMessage;
    }
};

const serializeError = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }

    return String(error);
};

class WinHelloChildProcess {
    private winHello: typeof WinHelloTypes | null = null;
    private isWindows: boolean;

    constructor() {
        this.isWindows = os.platform() === 'win32';
        const resourcesPath = process.env.RESOURCES_PATH;
        if (!resourcesPath) {
            console.error(
                '[WinHelloChildProcess] resourcesPath not provided in environment variable',
            );
            throw new Error('resourcesPath not provided in environment variable');
        }

        this.initialize(resourcesPath);
    }

    private initialize(resourcesPath: string) {
        if (!this.isWindows) {
            return;
        }

        const binaryPath = path.join(resourcesPath, 'bin', 'win_hello.node');

        try {
            const localRequiredBinary = require('../../suite-data/files/bin/win_hello.node');
            this.winHello = localRequiredBinary as typeof WinHelloTypes | null;
        } catch (err) {
            console.warn(
                `[WinHelloChildProcess] Failed to load local Windows Hello native module: ${serializeError(err)}`,
            );
        }

        if (!this.winHello) {
            if (!fs.existsSync(binaryPath)) {
                throw new Error(`Windows Hello native module not found at ${binaryPath}`);
            }
            const module = { exports: {} };
            try {
                // NOTE: using dlopen instead of require() to avoid problems with Electron that threw module not found error
                // even when the file existed in the production build
                process.dlopen(module, binaryPath);
                this.winHello = module.exports as typeof WinHelloTypes | null;
            } catch (err) {
                console.warn(
                    `[WinHelloChildProcess] Failed to load Windows Hello native module with dlopen: ${serializeError(err)}`,
                );
            }
        } else {
            console.warn('[WinHelloChildProcess] Using previously loaded binary');
        }
    }

    private handleIsHelloAvailable(): Promise<boolean> {
        return Promise.resolve().then(() => {
            if (!this.isWindows) {
                throw new Error('Windows Hello is only available on Windows platforms');
            }

            if (!this.winHello) {
                throw new Error('Windows Hello native module could not be loaded');
            }

            return this.winHello.isHelloAvailable();
        });
    }

    private handleRequestHello(message: string = 'Verify your identity'): Promise<string> {
        return Promise.resolve().then(() => {
            if (!this.isWindows) {
                throw new Error('Windows Hello is only available on Windows platforms');
            }

            if (!this.winHello) {
                throw new Error('Windows Hello native module could not be loaded');
            }

            const result = this.winHello.requestHello(message);

            if (result === 'Success') {
                return result;
            } else {
                throw new Error(errorMessageToStandardError(result));
            }
        });
    }

    private async handleRequest(request: IPCRequest): Promise<IPCResponse> {
        try {
            let result: any;

            switch (request.method) {
                case 'isHelloAvailable':
                    result = await this.handleIsHelloAvailable();
                    break;
                case 'requestHello':
                    result = await this.handleRequestHello(request.params?.message);
                    break;
                default:
                    throw new Error(`Unknown method: ${request.method}`);
            }

            return {
                id: request.id,
                success: true,
                result,
            };
        } catch (error) {
            return {
                id: request.id,
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    public start() {
        const processSend = process.send?.bind(process);
        if (!processSend) {
            throw new Error('This script must be run as a child process');
        }

        process.on('message', async (message: IPCRequest) => {
            const response = await this.handleRequest(message);
            processSend(response);
        });

        processSend({ ready: true });
    }
}

// Initialize the child process when this module is executed
try {
    const childProcess = new WinHelloChildProcess();
    childProcess.start();
} catch (error) {
    console.error(
        `[WinHelloChildProcess] Error starting child process: ${error instanceof Error ? error.message : String(error)}`,
    );
    // Re-throw to make sure the error is propagated
    throw error;
}
export { WinHelloChildProcess };
