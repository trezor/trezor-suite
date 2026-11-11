import type { RelayDevice, RelayMessage, WardRelay, WardRelayEndpoint } from '@trezor/ward';

import { ServiceCodec } from './serviceCodec';
import { ServiceTimeout, type ServiceTransport, openServiceTransport } from './serviceTransport';

export type DeviceService = {
    close: () => Promise<void>;
};

export type StartDeviceServiceParams = {
    wardd: WardRelay;
    devicePath: string;
    onError: () => void;
};

export class DeviceServiceConnection {
    private readonly codec: ServiceCodec;

    constructor(
        transport: ServiceTransport,
        private readonly backend: WardRelayEndpoint,
    ) {
        this.codec = new ServiceCodec(transport);
    }

    async announce(close = false): Promise<void> {
        // Codec-v1 wallet workflows restart the event loop. Only this idempotent
        // announcement may be retried across a restart; mutations are never retried.
        for (let attempt = 0; attempt < 3; attempt++) {
            await this.codec.write({
                name: 'WARDServiceOpen',
                message: { protocol_version: 1, close },
            });
            let ack: RelayMessage;
            try {
                ack = await this.codec.read(1000);
            } catch (error) {
                if (error instanceof ServiceTimeout && attempt < 2) continue;
                throw error;
            }
            if (
                ack.name !== 'WARDServiceOpenAck' ||
                ack.message.protocol_version !== 1 ||
                ack.message.buffer_size !== 64
            ) {
                throw new Error('Unsupported WARD service protocol');
            }

            return;
        }
    }

    private device(allowed: readonly string[]): RelayDevice {
        return async request => {
            if (!allowed.includes(request.name)) {
                throw new Error('Forbidden WARD service operation');
            }
            await this.codec.write(request);

            return this.codec.read();
        };
    }

    async serveOne(): Promise<void> {
        const request = await this.codec.read(100);
        let reply: RelayMessage;
        try {
            switch (request.name) {
                case 'WARDSyncAck':
                    await this.backend.call(
                        'serviceSync',
                        { initialAck: request.message },
                        this.device(['WARDIngestAttestation', 'WARDVerifyChain', 'WARDReconcile']),
                    );
                    reply = { name: 'WARDServiceDone', message: {} };
                    break;
                case 'WARDProofRequest':
                    reply = {
                        name: 'WARDProofAck',
                        message: await this.backend.call('answerProofRequest', {
                            request: request.message,
                        }),
                    };
                    break;
                case 'WARDNodeRequest':
                    reply = {
                        name: 'WARDNodeAck',
                        message: await this.backend.call('answerNodeRequest', {
                            request: request.message,
                            maxNodes: 1,
                        }),
                    };
                    break;
                case 'WARDPerformBatchAck':
                case 'WARDPerformRevertAck': {
                    const isRevert = request.name === 'WARDPerformRevertAck';
                    await this.backend.call(
                        'servicePublish',
                        { candidate: request.message, kind: isRevert ? 'revert' : 'commit' },
                        this.device([isRevert ? 'WARDConfirmRevertByWM' : 'WARDConfirmBatchByWM']),
                    );
                    reply = { name: 'WARDServiceDone', message: {} };
                    break;
                }
                default:
                    throw new Error('Unexpected WARD service request');
            }
        } catch {
            // Replica/backend details must stay out of device errors and console output.
            reply = { name: 'Failure', message: { code: 3, message: 'WARD backend unavailable' } };
        }
        await this.codec.write(reply);
    }
}

export const startDeviceService = async ({
    wardd,
    devicePath,
    onError,
}: StartDeviceServiceParams): Promise<DeviceService> => {
    const transport = await openServiceTransport(devicePath);
    const backend = await wardd.connect();
    const connection = new DeviceServiceConnection(transport, backend);
    try {
        await connection.announce();
    } catch (error) {
        backend.close();
        await transport.close();
        throw error;
    }
    let isRunning = true;
    let hasFailed = false;
    const worker = (async () => {
        while (isRunning) {
            try {
                await connection.serveOne();
            } catch (error) {
                if (error instanceof ServiceTimeout) continue;
                hasFailed = true;
                onError();

                return;
            }
        }
    })();
    let closing: Promise<void> | undefined;

    return {
        close: () => {
            closing ??= (async () => {
                isRunning = false;
                try {
                    await worker;
                    if (!hasFailed) await connection.announce(true);
                } finally {
                    backend.close();
                    await transport.close();
                }
            })();

            return closing;
        },
    };
};
