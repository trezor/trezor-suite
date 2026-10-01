import type { NetworkConfiguration } from '@trezor/network-module-suite-common-types';
import { supportedRippleNetworks } from '@trezor/network-ripple/constants';

/**
 * The send-form interface of the Ripple family. Platforms implement it with their own components;
 * the generic send form reads the rules from here.
 */
export const rippleNetworkConfiguration = {
    key: 'ripple',
    supportedNetworks: supportedRippleNetworks,
    send: {
        fields: [{ id: 'destinationTag', kind: 'uint32' }],
        fee: { model: 'per-transaction', unit: 'drops', selectable: false },
    },
} as const satisfies NetworkConfiguration;

export type RippleNetworkConfiguration = typeof rippleNetworkConfiguration;
