import { type Getter } from '@suite-common/dependency-injection';
import { type ConnectSettings, type Manifest } from '@trezor/connect';
import { type DefinitionsChannel } from '@trezor/connect-common';

export type ConnectInitSettingsDep = {
    connectInitSettings: { manifest: Manifest } & Partial<ConnectSettings>;
};

export type ConnectInitTransportName =
    | 'BridgeTransport'
    | 'NodeUsbTransport'
    | 'UdpTransport'
    | 'WebUsbTransport';

export type CreateTransportsDep = {
    createTransports: (transports: ConnectInitTransportName[]) => ConnectSettings['transports'];
};

export type GetDebugSettingsDep = {
    getDebugSettings: Getter<[], {
        transports: ConnectInitTransportName[];
        showConnectLogs: boolean;
        definitionsChannel?: DefinitionsChannel;
    }>;
};
