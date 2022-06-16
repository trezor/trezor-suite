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

export abstract class AbstractTransport {
    configured = false;
    version?: string;
    messages?: protobuf.Root;
    debug = false;
    abstract name: string;

    constructor({ debug = false }) {
        this.debug = debug;
    }

    abstract enumerate(): Promise<TrezorDeviceInfoWithSession[]>;
    abstract listen(old?: TrezorDeviceInfoWithSession[]): Promise<TrezorDeviceInfoWithSession[]>;
    abstract acquire(input: AcquireInput, debugLink: boolean): Promise<string>;
    abstract release(session: string, onclose: boolean, debugLink: boolean): Promise<void>;

    // maybe not needed?
    configure(messages: JSON) {
        // @ts-expect-error
        this.messages = protobuf.Root.fromJSON(messages);
        this.configured = true;
    }

    abstract call(
        session: string,
        name: string,
        data: Record<string, unknown>,
        debugLink: boolean,
    ): Promise<MessageFromTrezor>;

    abstract post(
        session: string,
        name: string,
        data: Record<string, unknown>,
        debugLink: boolean,
    ): Promise<void>;
    abstract read(session: string, debugLink: boolean): Promise<MessageFromTrezor>;

    // resolves when the transport can be used; rejects when it cannot
    abstract init(debug?: boolean): Promise<void>;

    // todo:
    requestDevice() {}
    // abstract stop(): void;

    // watch
    // call
    // read
}
