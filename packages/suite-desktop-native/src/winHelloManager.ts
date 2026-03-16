import { type ChildProcess, fork } from 'child_process';
import { randomUUID } from 'crypto';
import path from 'path';

import type {
    IPCReadyMessage,
    IPCRequest,
    IPCResponse,
    WinHelloManager,
    WinHelloManagerOptions,
} from './types';

// Constants
const REQUEST_TIMEOUT_MS = 30000; // 30 second timeout
const INITIALIZATION_TIMEOUT_MS = 30000; // 30 second initialization timeout
const GRACEFUL_SHUTDOWN_TIMEOUT_MS = 5000; // 5 second graceful shutdown timeout

export class WinHelloProcessManager implements WinHelloManager {
    private childProcess: ChildProcess | null = null;
    private pendingRequests = new Map<
        string,
        { resolve: (value: any) => void; reject: (error: Error) => void }
    >();
    private isReady = false;

    public create({ resourcesPath, logger }: WinHelloManagerOptions): Promise<void> {
        if (this.childProcess) {
            throw new Error('Child process already exists. Call destroy() first.');
        }

        return new Promise((resolve, reject) => {
            const childPath = path.join(__dirname, 'winHelloChildProcess.js');

            logger.info('win-hello', `resource path: ${resourcesPath}`);
            logger.info('win-hello', `Child process path: ${childPath}`);

            try {
                logger.info('win-hello', 'Creating child process...');
                this.childProcess = fork(childPath, [], {
                    env: {
                        ...process.env,
                        RESOURCES_PATH: resourcesPath,
                    },
                });
                logger.info('win-hello', 'Child process created');

                this.childProcess.on('message', (message: IPCResponse | IPCReadyMessage) => {
                    logger.info(
                        'win-hello',
                        `Received message from child: ${JSON.stringify(message)}`,
                    );
                    if ('ready' in message) {
                        this.isReady = true;
                        logger.info('win-hello', 'Child process is ready');
                        resolve();

                        return;
                    }

                    this.handleResponse(message);
                });

                this.childProcess.on('error', (error: Error) => {
                    logger.info('win-hello', `Child process error: ${error.message}`);
                    if (error.stack) {
                        logger.info('win-hello', `Error stack: ${error.stack}`);
                    }

                    this.cleanup();
                    reject(new Error(`Child process error: ${error.message}`));
                });

                this.childProcess.on('exit', (code: number | null) => {
                    logger.info('win-hello', `Child process exited with code: ${code}`);
                    this.cleanup();

                    if (!this.isReady) {
                        logger.info(
                            'win-hello',
                            'Child process exited before signaling ready state',
                        );
                        reject(
                            new Error(
                                `Child process exited before initialization was complete (code: ${code})`,
                            ),
                        );

                        return;
                    }

                    if (code !== 0) {
                        reject(new Error(`Child process exited with code ${code}`));
                    }
                });
            } catch (error) {
                logger.info(
                    'win-hello',
                    `Error creating child process: ${error instanceof Error ? error.message : String(error)}`,
                );
                if (error instanceof Error && error.stack) {
                    logger.info('win-hello', `Error stack: ${error.stack}`);
                }
                reject(
                    new Error(
                        `Failed to create child process: ${error instanceof Error ? error.message : String(error)}`,
                    ),
                );
            }

            setTimeout(() => {
                if (!this.isReady) {
                    this.destroy();
                    reject(new Error('Child process initialization timeout'));
                }
            }, INITIALIZATION_TIMEOUT_MS);
        });
    }

    public destroy(): Promise<void> {
        const { childProcess } = this;
        if (!childProcess) {
            return Promise.resolve();
        }

        return new Promise(resolve => {
            const cleanup = () => {
                this.cleanup();
                resolve();
            };

            childProcess.once('exit', cleanup);

            const killed = childProcess.kill();
            if (!killed) {
                cleanup();
            }

            setTimeout(() => {
                cleanup();
            }, GRACEFUL_SHUTDOWN_TIMEOUT_MS);
        });
    }

    public isHelloAvailable(): Promise<boolean> {
        return this.sendRequest('isHelloAvailable');
    }
    public requestHello(message: string = 'Verify your identity'): Promise<string> {
        return this.sendRequest('requestHello', { message });
    }

    private sendRequest<T extends 'isHelloAvailable' | 'requestHello'>(
        method: T,
        params?: T extends 'requestHello'
            ? { message?: string; windowHandle?: Buffer | null }
            : undefined,
    ): Promise<T extends 'isHelloAvailable' ? boolean : string> {
        if (!this.childProcess || !this.isReady) {
            throw new Error('Child process not initialized. Call create() first.');
        }

        const id = randomUUID();
        const request: IPCRequest = {
            id,
            method,
            params,
        };

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });

            // Set timeout for the request
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(id);
                reject(new Error(`Request timeout for method: ${method}`));
            }, REQUEST_TIMEOUT_MS);

            // Clear timeout when request completes
            const originalResolve = resolve;
            const originalReject = reject;

            this.pendingRequests.set(id, {
                resolve: value => {
                    clearTimeout(timeout);
                    originalResolve(value);
                },
                reject: error => {
                    clearTimeout(timeout);
                    originalReject(error);
                },
            });

            this.childProcess!.send(request);
        });
    }

    private handleResponse(response: IPCResponse) {
        const pending = this.pendingRequests.get(response.id);
        if (!pending) {
            return;
        }

        this.pendingRequests.delete(response.id);

        if (response.success) {
            pending.resolve(response.result);
        } else {
            pending.reject(new Error(response.error || 'Unknown error'));
        }
    }

    private cleanup() {
        this.childProcess = null;
        this.isReady = false;

        for (const [_id, { reject }] of this.pendingRequests) {
            reject(new Error('Child process terminated'));
        }
        this.pendingRequests.clear();
    }
}

export async function createWinHelloManager(
    options: WinHelloManagerOptions,
): Promise<WinHelloManager> {
    const manager = new WinHelloProcessManager();
    await manager.create(options);

    return manager;
}
