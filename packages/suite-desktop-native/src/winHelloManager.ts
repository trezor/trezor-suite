import { randomUUID } from 'crypto';
import path from 'path';
import { Worker } from 'worker_threads';

import type { IPCRequest, IPCResponse, WinHelloManager } from './types';

export class WinHelloProcessManager implements WinHelloManager {
    private worker: Worker | null = null;
    private pendingRequests = new Map<
        string,
        { resolve: (value: any) => void; reject: (error: Error) => void }
    >();
    private isReady = false;

    /**
     * Creates and initializes the worker thread
     */
    public create({
        resourcesPath,
        logger,
    }: {
        resourcesPath: string;
        logger: {
            info: (topic: string, message: string) => void;
        };
    }): Promise<void> {
        if (this.worker) {
            throw new Error('Worker thread already exists. Call destroy() first.');
        }

        return new Promise((resolve, reject) => {
            const workerPath = path.join(__dirname, 'winHelloChildProcess.js');

            logger.info('win-hello', `resource path: ${resourcesPath}`);
            logger.info('win-hello', `Worker path: ${workerPath}`);

            try {
                logger.info('win-hello', 'Creating worker thread...');
                this.worker = new Worker(workerPath, {
                    workerData: {
                        resourcesPath,
                    },
                });
                logger.info('win-hello', 'Worker thread created');

                this.worker.on('message', (message: any) => {
                    logger.info(
                        'win-hello',
                        `Received message from worker: ${JSON.stringify(message)}`,
                    );
                    if (message.ready) {
                        this.isReady = true;
                        logger.info('win-hello', 'Worker is ready');
                        resolve();

                        return;
                    }

                    this.handleResponse(message as IPCResponse);
                });

                this.worker.on('error', error => {
                    logger.info('win-hello', `Worker error: ${error.message}`);
                    if (error.stack) {
                        logger.info('win-hello', `Worker error stack: ${error.stack}`);
                    }
                    reject(new Error(`Worker thread error: ${error.message}`));
                });

                this.worker.on('exit', code => {
                    logger.info('win-hello', `Worker exited with code: ${code}`);
                    this.cleanup();

                    // If the worker exits before it's ready, it's an error regardless of exit code
                    if (!this.isReady) {
                        logger.info('win-hello', 'Worker exited before signaling ready state');
                        reject(
                            new Error(
                                `Worker thread exited before initialization was complete (code: ${code})`,
                            ),
                        );

                        return;
                    }

                    // Even with code 0, if it's unexpected, log it as a warning
                    if (code === 0) {
                        logger.info(
                            'win-hello',
                            'Worker exited normally, but this might be unexpected during operation',
                        );
                    } else {
                        reject(new Error(`Worker thread exited with code ${code}`));
                    }
                });

                // Add online event to see when worker is actually running
                this.worker.on('online', () => {
                    logger.info('win-hello', 'Worker thread is now online');
                });
            } catch (error) {
                logger.info(
                    'win-hello',
                    `Error creating worker: ${error instanceof Error ? error.message : String(error)}`,
                );
                if (error instanceof Error && error.stack) {
                    logger.info('win-hello', `Error stack: ${error.stack}`);
                }
                reject(
                    new Error(
                        `Failed to create worker thread: ${error instanceof Error ? error.message : String(error)}`,
                    ),
                );
            }

            setTimeout(() => {
                this.isReady = true;
                logger.info('win-hello', 'Worker thread initialized manuallz after timeout');
                resolve();
            }, 10000);

            // Set a timeout for initialization
            setTimeout(() => {
                if (!this.isReady) {
                    this.destroy();
                    reject(new Error('Worker thread initialization timeout'));
                }
            }, 30000); // 30 second timeout
        });
    }

    /**
     * Destroys the worker thread
     */
    public destroy(): Promise<void> {
        if (!this.worker) {
            return Promise.resolve();
        }

        return new Promise(resolve => {
            const cleanup = () => {
                this.cleanup();
                resolve();
            };

            // Try graceful shutdown first
            this.worker!.once('exit', cleanup);
            this.worker!.terminate()
                .then(() => {
                    cleanup();
                })
                .catch(() => {
                    // Force cleanup even if termination fails
                    cleanup();
                });

            // Force cleanup after timeout
            setTimeout(() => {
                cleanup();
            }, 5000);
        });
    }

    /**
     * Checks if Windows Hello is available on the system
     */
    public isHelloAvailable(): Promise<boolean> {
        return this.sendRequest('isHelloAvailable');
    }

    /**
     * Requests Windows Hello authentication
     */
    public requestHello(
        message: string = 'Verify your identity',
        windowHandle: Buffer | null = null,
    ): Promise<string> {
        return this.sendRequest('requestHello', { message, windowHandle });
    }

    private sendRequest(method: 'isHelloAvailable' | 'requestHello', params?: any): Promise<any> {
        if (!this.worker || !this.isReady) {
            throw new Error('Worker thread not initialized. Call create() first.');
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
            }, 30000); // 30 second timeout

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

            this.worker!.postMessage(request);
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
        this.worker = null;
        this.isReady = false;

        // Reject all pending requests
        for (const [_id, { reject }] of this.pendingRequests) {
            reject(new Error('Worker thread terminated'));
        }
        this.pendingRequests.clear();
    }
}

export async function createWinHelloManager({
    resourcesPath,
    logger,
}: {
    resourcesPath: string;
    logger: {
        info: (topic: string, message: string) => void;
    };
}): Promise<WinHelloManager> {
    const manager = new WinHelloProcessManager();
    await manager.create({ resourcesPath, logger });

    return manager;
}
