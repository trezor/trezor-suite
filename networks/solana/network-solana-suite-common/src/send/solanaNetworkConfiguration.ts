import type { NetworkConfiguration } from '@trezor/network-module-suite-common-types';
import { SOLANA_MEMO_MAX_BYTES, supportedSolanaNetworks } from '@trezor/network-solana/constants';

/**
 * The send-form interface of the Solana family. Platforms implement it with their own components;
 * the generic send form reads the rules from here.
 */
export const solanaNetworkConfiguration = {
    key: 'solana',
    supportedNetworks: supportedSolanaNetworks,
    send: {
        fields: [{ id: 'memo', kind: 'text', limit: { bytes: SOLANA_MEMO_MAX_BYTES } }],
        fee: { model: 'priority', unit: 'lamports', selectable: true },
    },
} as const satisfies NetworkConfiguration;

export type SolanaNetworkConfiguration = typeof solanaNetworkConfiguration;
