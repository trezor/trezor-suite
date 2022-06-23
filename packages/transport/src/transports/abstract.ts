import * as protobuf from 'protobufjs/light';

// does not have session
export type TrezorDeviceInfo = {
    path: string;
};

export type TrezorDeviceInfoDebug = {
    path: string;
    debug: boolean;
};

export type TrezorDeviceInfoWithSession = TrezorDeviceInfo & {
    session?: string | null;
    debugSession?: string | null;
    debug: boolean;
};

export type AcquireInput = {
    path: string;
    previous?: string;
};

export type MessageFromTrezor = { type: string; message: Record<string, unknown> };

export abstract class Transport {
    configured = false;
    messages?: protobuf.Root;
    debug = false;
    name = '';
    version = '';

    constructor({ debug = false }) {
        this.debug = debug;
    }

    abstract enumerate(old?: TrezorDeviceInfoWithSession[]): Promise<TrezorDeviceInfoWithSession[]>;
    // TODO(karliatto): we want to totally get rid of `listen`, and use instead `enumerate`.
    // abstract listen(old?: TrezorDeviceInfoWithSession[]): Promise<TrezorDeviceInfoWithSession[]>;
    abstract acquire({
        input,
        debug,
        first,
    }: {
        input: AcquireInput;
        debug: boolean;
        first?: boolean;
    }): Promise<string>;
    abstract release(session: string, onclose: boolean, debugLink: boolean): Promise<void>;

    // maybe not needed?
    configure(messages: JSON) {
        // @ts-expect-error
        this.messages = protobuf.Root.fromJSON(messages);
        this.configured = true;
    }

    // abstract post(
    //     session: string,
    //     name: string,
    //     data: Record<string, unknown>,
    //     debugLink: boolean,
    // ): Promise<void>;
    // abstract read(session: string, debugLink: boolean): Promise<MessageFromTrezor>;
    // resolves when the transport can be used; rejects when it cannot
    abstract init(debug?: boolean): Promise<void>;

    /**
     * Encode data and write it to transport layer
     */
    abstract send({
        path,
        session,
        data,
        debug,
        name,
    }: {
        path?: string;
        session?: string;
        debug: boolean;
        // wrap object and name?
        name: string;
        data: Record<string, unknown>;
    }): Promise<void>;

    // only read from transport
    abstract receive({
        path,
        session,
        debug,
    }: {
        path?: string;
        session?: string;
        debug: boolean;
    }): Promise<MessageFromTrezor>;

    // send and read after that
    abstract call({
        session,
        name,
        data,
        debug,
    }: {
        session: string;
        name: string;
        data: Record<string, unknown>;
        debug: boolean;
    }): Promise<MessageFromTrezor>;

    // todo:
    requestDevice() {}
    // abstract stop(): void;

    // watch
    // call
    // read
}
