import fs from 'fs';
import * as os from 'os';
import path from 'path';

import type * as WinHelloTypes from './win_hello.d';

const errorMessageToStandardError = (errorMessage: string) => {
    switch (errorMessage) {
        case 'Canceled':
            return 'Authentication canceled.';
        default:
            return errorMessage;
    }
};

export function createWinHello() {
    const isWindows = os.platform() === 'win32';
    let winHello: typeof WinHelloTypes | null = null;

    // @ts-expect-error resourcesPath is not defined on Process
    const { resourcesPath } = process;

    const binaryPath = path.join(resourcesPath, 'bin/win_hello.node');

    if (isWindows) {
        try {
            const localRequiredBinary = require('../../suite-data/files/bin/win_hello.node');
            winHello = localRequiredBinary as typeof WinHelloTypes | null;
        } catch (err) {
            console.warn(`Failed to load local Windows Hello native module: ${err.message}`);
        }

        if (!winHello) {
            if (!fs.existsSync(binaryPath)) {
                throw new Error(`Windows Hello native module not found at ${binaryPath}`);
            }
            const module = { exports: {} };
            try {
                // NOTE: using dlopen instead of require() to avoid problems with Electron that threw module not found error
                // even when the file existed in the production build
                process.dlopen(module, binaryPath);
                winHello = module.exports as typeof WinHelloTypes | null;
            } catch (err) {
                console.warn(
                    `Failed to load Windows Hello native module with dlopen: ${err.message}`,
                );
            }
        }
    }

    return {
        isHelloAvailable(): Promise<boolean> {
            return new Promise((resolve, reject) => {
                if (!isWindows) {
                    reject(new Error('Windows Hello is only available on Windows platforms'));

                    return;
                }

                if (!winHello) {
                    reject(new Error('Windows Hello native module could not be loaded'));

                    return;
                }

                try {
                    const result = winHello.isHelloAvailable();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
        },

        requestHello(
            message: string = 'Verify your identity',
            windowHandle: Buffer | null = null,
        ): Promise<string> {
            return new Promise((resolve, reject) => {
                if (!isWindows) {
                    reject(new Error('Windows Hello is only available on Windows platforms'));

                    return;
                }

                if (!winHello) {
                    reject(new Error('Windows Hello native module could not be loaded'));

                    return;
                }

                try {
                    const result = winHello.requestHello(message, windowHandle);

                    if (result === 'Success') {
                        resolve(result);
                    } else {
                        reject(new Error(errorMessageToStandardError(result)));
                    }
                } catch (error) {
                    reject(error);
                }
            });
        },
    };
}
