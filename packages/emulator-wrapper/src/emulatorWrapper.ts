import dgram from 'node:dgram';

import { FirmwareInterceptor } from './firmwareInterceptor';
import type { RecordingFixture } from './recordedFrame';

export interface ProxyEndpointConfig {
    listenPort: number;
    targetHost: string;
    targetPort: number;
}

export interface FirmwareUpdateInterceptConfig {
    fixture: RecordingFixture;
}

export interface InterceptConfig {
    firmwareUpdate?: FirmwareUpdateInterceptConfig;
}

export interface EmulatorWrapperConfig {
    main: ProxyEndpointConfig;
    debug?: ProxyEndpointConfig;
    listenHost?: string;
    logger?: (message: string) => void;
    intercept?: InterceptConfig;
}

export interface ResolvedEndpoint {
    listenHost: string;
    listenPort: number;
    targetHost: string;
    targetPort: number;
}

interface EndpointRuntime {
    config: ProxyEndpointConfig;
    listenSocket: dgram.Socket;
    upstreamSocket: dgram.Socket;
    actualListenPort: number;
    lastClient?: { address: string; port: number };
}

const DEFAULT_LISTEN_HOST = '127.0.0.1';

const bindSocket = (socket: dgram.Socket, port: number, host: string) =>
    new Promise<number>((resolve, reject) => {
        socket.once('listening', () => {
            socket.removeAllListeners('error');
            resolve(socket.address().port);
        });
        socket.once('error', error => {
            socket.removeAllListeners('listening');
            reject(error);
        });
        socket.bind(port, host);
    });

const closeSocket = (socket: dgram.Socket) =>
    new Promise<void>(resolve => {
        try {
            socket.close(() => resolve());
        } catch {
            resolve();
        }
    });

export class EmulatorWrapper {
    private readonly listenHost: string;
    private readonly log: (message: string) => void;
    private readonly endpointConfigs: ProxyEndpointConfig[];
    private readonly mainEndpointConfig: ProxyEndpointConfig;
    private endpoints: EndpointRuntime[] = [];
    private running = false;
    private firmwareInterceptor: FirmwareInterceptor | null;

    constructor(config: EmulatorWrapperConfig) {
        this.listenHost = config.listenHost ?? DEFAULT_LISTEN_HOST;
        this.log = config.logger ?? (() => {});
        this.mainEndpointConfig = config.main;
        this.endpointConfigs = [config.main, ...(config.debug ? [config.debug] : [])];
        this.firmwareInterceptor = config.intercept?.firmwareUpdate
            ? new FirmwareInterceptor({
                  fixture: config.intercept.firmwareUpdate.fixture,
                  logger: this.log,
              })
            : null;
    }

    async start() {
        if (this.running) {
            throw new Error('EmulatorWrapper is already running');
        }
        this.running = true;
        try {
            this.endpoints = await Promise.all(
                this.endpointConfigs.map(endpoint => this.startEndpoint(endpoint)),
            );
        } catch (error) {
            await this.stop();
            throw error;
        }
    }

    getEndpoints(): ResolvedEndpoint[] {
        return this.endpoints.map(endpoint => ({
            listenHost: this.listenHost,
            listenPort: endpoint.actualListenPort,
            targetHost: endpoint.config.targetHost,
            targetPort: endpoint.config.targetPort,
        }));
    }

    async stop() {
        this.running = false;
        const { endpoints } = this;
        this.endpoints = [];
        await Promise.all(
            endpoints.flatMap(endpoint => [
                closeSocket(endpoint.listenSocket),
                closeSocket(endpoint.upstreamSocket),
            ]),
        );
    }

    private async startEndpoint(config: ProxyEndpointConfig): Promise<EndpointRuntime> {
        const listenSocket = dgram.createSocket('udp4');
        const upstreamSocket = dgram.createSocket('udp4');
        const runtime: EndpointRuntime = {
            config,
            listenSocket,
            upstreamSocket,
            actualListenPort: config.listenPort,
        };

        const isMainEndpoint = config === this.mainEndpointConfig;
        listenSocket.on('message', (message, info) => {
            runtime.lastClient = { address: info.address, port: info.port };
            if (isMainEndpoint && this.firmwareInterceptor) {
                const result = this.firmwareInterceptor.handleClientChunk(Buffer.from(message));
                if (result.handled) {
                    for (const reply of result.replyChunks) {
                        listenSocket.send(reply, info.port, info.address, err => {
                            if (err) {
                                this.log(`wrapper intercept reply error: ${err.message}`);
                            }
                        });
                    }

                    return;
                }
            }
            this.log(
                `wrapper :${config.listenPort} <- ${info.address}:${info.port} (${message.length}B) -> ${config.targetHost}:${config.targetPort}`,
            );
            upstreamSocket.send(message, config.targetPort, config.targetHost, error => {
                if (error) {
                    this.log(`wrapper upstream send error: ${error.message}`);
                }
            });
        });

        upstreamSocket.on('message', message => {
            const { lastClient } = runtime;
            if (!lastClient) {
                this.log(
                    `wrapper :${config.listenPort} dropped reply from upstream (no client recorded yet)`,
                );

                return;
            }
            this.log(
                `wrapper :${config.listenPort} <- ${config.targetHost}:${config.targetPort} (${message.length}B) -> ${lastClient.address}:${lastClient.port}`,
            );
            listenSocket.send(message, lastClient.port, lastClient.address, error => {
                if (error) {
                    this.log(`wrapper client send error: ${error.message}`);
                }
            });
        });

        listenSocket.on('error', error => {
            this.log(`wrapper listen socket :${config.listenPort} error: ${error.message}`);
        });
        upstreamSocket.on('error', error => {
            this.log(`wrapper upstream socket error: ${error.message}`);
        });

        runtime.actualListenPort = await bindSocket(
            listenSocket,
            config.listenPort,
            this.listenHost,
        );

        const BUFFER_SIZE = 4 * 1024 * 1024;
        try {
            listenSocket.setRecvBufferSize(BUFFER_SIZE);
            listenSocket.setSendBufferSize(BUFFER_SIZE);
            upstreamSocket.setRecvBufferSize(BUFFER_SIZE);
            upstreamSocket.setSendBufferSize(BUFFER_SIZE);
        } catch (e) {
            this.log(`wrapper buffer resize warning: ${(e as Error).message}`);
        }

        return runtime;
    }
}
