import {
    CardanoAddressType,
    CardanoCertificateType,
    CardanoPoolRelayType,
} from '@trezor/transport/lib/types/messages';

export enum PROTOCOL_MAGICS {
    mainnet = 764824073,
    testnet = 42,
}

export enum NETWORK_IDS {
    mainnet = 1,
    testnet = 0,
}

export const ADDRESS_TYPE = CardanoAddressType;

export const CERTIFICATE_TYPE = CardanoCertificateType;

export const POOL_RELAY_TYPE = CardanoPoolRelayType;
