import { supportedBitcoinNetworks } from '@trezor/network-bitcoin/constants';
import type { NetworkConfiguration } from '@trezor/network-module-suite-common-types';

/**
 * The send-form interface of the Bitcoin family. Platforms implement it with their own components;
 * the generic send form reads the rules from here.
 */
export const bitcoinNetworkConfiguration = {
    key: 'bitcoin',
    supportedNetworks: supportedBitcoinNetworks,
    send: {
        fields: [],
        fee: { model: 'per-byte', unit: 'sat/vB', selectable: true },
    },
} as const satisfies NetworkConfiguration;

export type BitcoinNetworkConfiguration = typeof bitcoinNetworkConfiguration;
