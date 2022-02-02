import type { Transport, AcquireInput, TrezorDeviceInfoWithSession } from './types';

export default class FallbackTransport {
    _availableTransports: Array<Transport> = [];
    activeName = '';
    // @ts-ignore
    activeTransport: Transport;
    configured = false;
    debug = false;
    isOutdated = false;
    name = 'FallbackTransport';
    requestNeeded = false;
    transports: Array<Transport> = [];
    version = '';

    constructor(transports: Array<Transport>) {
        this.transports = transports;
    }

    // first one that inits successfully is the final one; others won't even start initiating
    async _tryInitTransports() {
        const res: Array<Transport> = [];
        let lastError: any = null;
        for (const transport of this.transports) {
            try {
                await transport.init(this.debug);
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
    async _tryConfigureTransports(data: JSON | string) {
        let lastError: any = null;
        for (const transport of this._availableTransports) {
            try {
                await transport.configure(data);
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

    async configure(signedData: JSON | string) {
        const pt: Promise<Transport> = this._tryConfigureTransports(signedData);
        this.activeTransport = await pt;
        this.configured = this.activeTransport.configured;
        this.version = this.activeTransport.version;
        this.activeName = this.activeTransport.name;
        this.requestNeeded = this.activeTransport.requestNeeded;
        this.isOutdated = this.activeTransport.isOutdated;
    }

    enumerate() {
        return this.activeTransport.enumerate();
    }

    listen(old?: Array<TrezorDeviceInfoWithSession>) {
        return this.activeTransport.listen(old);
    }

    acquire(input: AcquireInput, debugLink: boolean) {
        return this.activeTransport.acquire(input, debugLink);
    }

    release(session: string, onclose: boolean, debugLink: boolean) {
        return this.activeTransport.release(session, onclose, debugLink);
    }

    call(session: string, name: string, data: Record<string, unknown>, debugLink: boolean) {
        return this.activeTransport.call(session, name, data, debugLink);
    }

    post(session: string, name: string, data: Record<string, unknown>, debugLink: boolean) {
        return this.activeTransport.post(session, name, data, debugLink);
    }

    read(session: string, debugLink: boolean) {
        return this.activeTransport.read(session, debugLink);
    }

    requestDevice() {
        return this.activeTransport.requestDevice();
    }

    setBridgeLatestUrl(url: string) {
        for (const transport of this.transports) {
            transport.setBridgeLatestUrl(url);
        }
    }

    setBridgeLatestVersion(version: string) {
        for (const transport of this.transports) {
            transport.setBridgeLatestVersion(version);
        }
    }

    stop() {
        for (const transport of this.transports) {
            transport.stop();
        }
    }
}
