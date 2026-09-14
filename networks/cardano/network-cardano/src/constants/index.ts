export {
    isSupportedCardanoNetwork,
    supportedCardanoNetworks,
    toCardanoNetworkSymbol,
} from './networkSymbol';
export type { CardanoNetworkSymbol } from './networkSymbol';

// Single import surface for Cardano consumers; imports nothing, so it stays free of the WASM lib.
export {
    type CardanoProtocolParams,
    DEFAULT_CARDANO_PROTOCOL_PARAMS,
    getProtocolParamsDrift,
    type ProtocolParamDrift,
} from '@trezor/network-cardano-coin-selection/src/protocolParams';

export const CARDANO_DECIMALS = 6;
