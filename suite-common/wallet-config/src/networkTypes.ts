import type { NetworkSymbol } from '@suite-common/networks';

export {
    asNetworkSymbol,
    TREZOR_CONNECT_BACKENDS,
    type AccountType,
    type BackendOption,
    type BackendType,
    type Explorer,
    type Network,
    type NetworkAccount,
    type NetworkFeature,
    type Networks,
    type NetworkSymbol,
    type NetworkType,
    type ServerType,
    type TrezorConnectBackendType,
} from '@suite-common/networks';

/**
 * Used for some edge cases where extension of NetworkSymbol is necessary.
 * Autocomplete is working as expected but can be passed any string.
 */
export type NetworkSymbolExtended = NetworkSymbol | (string & {});
