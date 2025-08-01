/**
 * Worker thread module for Windows Hello native binary operations
 * This runs in a separate worker thread to isolate the dlopen operations
 */

import fs from 'fs';
import * as os from 'os';
import path from 'path';
import { isMainThread, parentPort, workerData } from 'worker_threads';

import type { IPCMessage, IPCRequest, IPCResponse } from './types';
import type * as WinHelloTypes from './win_hello.d';

const errorMessageToStandardError = (errorMessage: string) => {
    switch (errorMessage) {
        case 'Canceled':
            return 'Authentication canceled.';
        default:
            return errorMessage;
    }
};

class WinHelloChildProcess {
    private winHello: typeof WinHelloTypes | null = null;
    private isWindows: boolean;

    constructor() {
        this.isWindows = os.platform() === 'win32';
        this.initialize();
    }

    private initialize() {
        if (!this.isWindows) {
            return;
        }

        const resourcesPath = workerData?.resourcesPath;
        if (!resourcesPath) {
            console.error('[WinHelloChildProcess] resourcesPath not provided in workerData');
            throw new Error('resourcesPath not provided in workerData');
        }

        const binaryPath = path.join(resourcesPath, 'bin/win_hello.node');

        try {
            const localRequiredBinary = require('../../suite-data/files/bin/win_hello.node');
            this.winHello = localRequiredBinary as typeof WinHelloTypes | null;
        } catch (err) {
            console.warn(
                `[WinHelloChildProcess] Failed to load local Windows Hello native module: ${(err as Error).message}`,
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
                    `[WinHelloChildProcess] Failed to load Windows Hello native module with dlopen: ${(err as Error).message}`,
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

    private handleRequestHello(
        message: string = 'Verify your identity',
        windowHandle: Buffer | null = null,
    ): Promise<string> {
        return Promise.resolve().then(() => {
            if (!this.isWindows) {
                throw new Error('Windows Hello is only available on Windows platforms');
            }

            if (!this.winHello) {
                throw new Error('Windows Hello native module could not be loaded');
            }

            const result = this.winHello.requestHello(message, windowHandle);

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
                    result = await this.handleRequestHello(
                        request.params?.message,
                        request.params?.windowHandle,
                    );
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
        if (!parentPort) {
            throw new Error('This script must be run as a worker thread');
        }

        parentPort.on('message', async (message: IPCMessage) => {
            if ('method' in message) {
                const response = await this.handleRequest(message);
                parentPort!.postMessage(response);
            }
        });

        parentPort.postMessage({ ready: true });
    }
}

if (!isMainThread) {
    try {
        const workerProcess = new WinHelloChildProcess();
        workerProcess.start();
    } catch (error) {
        console.error(
            `[WinHelloChildProcess] Error starting worker: ${error instanceof Error ? error.message : String(error)}`,
        );
        if (error instanceof Error && error.stack) {
            console.error(`[WinHelloChildProcess] Stack trace: ${error.stack}`);
        }
        // Re-throw to make sure the error is propagated
        throw error;
    }
}
export { WinHelloChildProcess };
