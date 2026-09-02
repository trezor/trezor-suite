import { type Getter } from '@suite-common/dependency-injection';
import {
    type ConnectInitSettings,
    type ConnectInitSettingsDep,
    type CreateTransports,
    type TransportName,
    type TransportsDep,
} from '@suite-common/suite-types';
import { type CreateLogger } from '@trezor/connect';
import { type DefinitionsChannel } from '@trezor/connect-common';
import { type Transport } from '@trezor/transport-common';

export type {
    ConnectInitSettings,
    ConnectInitSettingsDep,
    CreateTransports,
    TransportName,
    TransportsDep,
};

// Web/native yield a constructed Transport instance. The desktop renderer can't build node-only
// transports (`usb`/`dgram`), so it yields the identifier string — the main process maps it to an
// instance below the IPC boundary (see suite-desktop-core/src/modules/trezor-connect.ts).
export type TransportFactory = (logger?: CreateLogger) => Transport | TransportName;

export type GetTransportsFactories = () => Partial<Record<TransportName, TransportFactory>>;

export type GetTransportsFactoriesDep = {
    getTransportsFactories: GetTransportsFactories;
};

export type GetDebugSettingsDep = {
    getDebugSettings: Getter<
        [],
        {
            transports: TransportName[];
            showConnectLogs: boolean;
            definitionsChannel?: DefinitionsChannel;
        }
    >;
};
