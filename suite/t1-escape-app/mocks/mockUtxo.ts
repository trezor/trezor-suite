import type { Utxo } from '@trezor/blockchain-link-types';

export const mockUtxo = (overrides: Partial<Utxo> = {}): Utxo => ({
    txid: 'a'.repeat(64),
    vout: 0,
    amount: '100000',
    address: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
    path: "m/44'/0'/0'/0/0",
    confirmations: 6,
    blockHeight: 800000,
    ...overrides,
});
