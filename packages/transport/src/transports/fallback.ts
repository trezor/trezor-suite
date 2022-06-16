import type { AcquireInput, TrezorDeviceInfoWithSession } from '../types';
import { AbstractTransport } from './abstract';
export class FallbackTransport extends AbstractTransport {
    _availableTransports: AbstractTransport[] = [];
    _activeTransport?: AbstractTransport;
    _transports: AbstractTransport[] = [];

    name = 'FallbackTransport';

    constructor({ transports, debug }: { transports: AbstractTransport[]; debug: boolean }) {
        super({ debug });
        this._transports = transports;
    }

    // first one that inits successfully is the final one; others won't even start initiating
    async _tryInitTransports() {
        const res: AbstractTransport[] = [];
        let lastError: any = null;
        for (const transport of this._transports) {
            try {
                await transport.init();
                res.push(transport);
            } catch (e) {
                lastError = e;
            }
        }
        if (res.length === 0) {
            throw lastError || new Error('No transport could be initialized.');
        }
        return res;
    }

    // first one that inits successfully is the final one; others won't even start initing
    async _tryConfigureTransports(data: JSON) {
        let lastError: any = null;
        for (const transport of this._availableTransports) {
            try {
                transport.configure(data);
                return transport;
            } catch (e) {
                lastError = e;
            }
        }
        throw lastError || new Error('No transport could be initialized.');
    }

    async init(debug?: boolean) {
        this.debug = !!debug;

        // init ALL OF THEM
        const transports = await this._tryInitTransports();
        this._availableTransports = transports;

        // a slight hack - configured is always false, so we force caller to call configure()
        // to find out the actual working transport (bridge falls on configure, not on info)
        this.version = transports[0].version;
        this.configured = false;
    }

    async configure(signedData: JSON) {
        const pt: Promise<AbstractTransport> = this._tryConfigureTransports(signedData);
        this._activeTransport = await pt;
        this.configured = this._activeTransport.configured;
        this.version = this._activeTransport.version;
        this.name = this._activeTransport.name;
    }

    enumerate() {
        return this._activeTransport!.enumerate();
    }

    listen(old?: Array<TrezorDeviceInfoWithSession>) {
        return this._activeTransport!.listen(old);
    }

    acquire(input: AcquireInput, debugLink: boolean) {
        return this._activeTransport!.acquire(input, debugLink);
    }

    release(session: string, onclose: boolean, debugLink: boolean) {
        return this._activeTransport!.release(session, onclose, debugLink);
    }

    call(session: string, name: string, data: Record<string, unknown>, debugLink: boolean) {
        return this._activeTransport!.call(session, name, data, debugLink);
    }

    post(session: string, name: string, data: Record<string, unknown>, debugLink: boolean) {
        return this._activeTransport!.post(session, name, data, debugLink);
    }

    read(session: string, debugLink: boolean) {
        return this._activeTransport!.read(session, debugLink);
    }

    requestDevice() {
        return this._activeTransport!.requestDevice();
    }

    // stop() {
    //     for (const transport of this.transports) {
    //         transport.stop();
    //     }
    // }
}
