import type { NetworkSymbol } from '@trezor/network-module-types';

export type NetworkOption = {
    readonly symbol: NetworkSymbol;
    readonly name: string;
};

export type Readable<T> = {
    // Return an immutable value with the same reference until the selected data changes.
    getSnapshot: () => T;
    subscribe: (onChange: () => void) => () => void;
    getServerSnapshot?: () => T;
};

/** @serviceContract */
export type NetworkDisplayServices = {
    // Without an explicit list, the host decides which networks are available.
    getNetworks: (symbols?: readonly NetworkSymbol[]) => Readable<readonly NetworkOption[]>;
};

export type NetworkDisplayServicesDep = {
    networkDisplayServices: NetworkDisplayServices;
};
