import { WebUSB } from 'usb';

import {
    AbstractApiTransport,
    type AbstractTransportParams,
    UsbApi,
} from '@trezor/transport-common';

export type ChunkObserver = (dir: 'out' | 'in', chunk: Buffer, ts: number) => void;

class RecordingUsbApi extends UsbApi {
    public observer?: ChunkObserver;

    write(path: string, buffer: Buffer, signal?: AbortSignal) {
        this.observer?.('out', Buffer.from(buffer), Date.now());

        return super.write(path, buffer, signal);
    }

    async read(path: string, signal?: AbortSignal) {
        const result = await super.read(path, signal);
        if (result.success && result.payload.length > 0) {
            this.observer?.('in', Buffer.from(result.payload), Date.now());
        }

        return result;
    }
}

export class RecordingNodeUsbTransport extends AbstractApiTransport {
    public name = 'NodeUsbTransport' as const;
    private recordingApi: RecordingUsbApi;

    constructor(params: AbstractTransportParams, observer: ChunkObserver) {
        const { logger, debugLink, ...rest } = params;
        const api = new RecordingUsbApi({
            usbInterface: new WebUSB({
                allowAllDevices: true,
            }),
            logger,
            debugLink,
        });
        api.observer = observer;
        super({
            api,
            logger,
            ...rest,
        });
        this.recordingApi = api;
    }

    setObserver(observer: ChunkObserver) {
        this.recordingApi.observer = observer;
    }
}
