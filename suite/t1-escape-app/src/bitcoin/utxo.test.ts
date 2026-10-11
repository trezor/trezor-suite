import type { Utxo } from '@trezor/blockchain-link-types';

import { isConfirmedUtxo, isWellFormedUtxo } from './utxo';
import { mockUtxo } from '../../mocks/mockUtxo';

// Backend data is untyped at runtime. This builds what a broken backend could send.
const untypedUtxo = (overrides: Record<string, unknown>) =>
    ({ ...mockUtxo(), ...overrides }) as Utxo;

describe('isWellFormedUtxo', () => {
    it('accepts a regular unspent output', () => {
        expect(isWellFormedUtxo(mockUtxo())).toBe(true);
        expect(isWellFormedUtxo(mockUtxo({ path: "m/84'/0'/12'/1/345", vout: 7 }))).toBe(true);
    });

    it.each<[string, Record<string, unknown>]>([
        ['a txid that is not 32 bytes of hex', { txid: 'abc' }],
        ['a missing txid', { txid: undefined }],
        ['a negative output index', { vout: -1 }],
        ['a fractional output index', { vout: 0.5 }],
        ['an amount that is not a number', { amount: 'lots' }],
        ['a numeric amount instead of a string', { amount: 100000 }],
        ['a negative amount', { amount: '-5' }],
        ['a zero amount', { amount: '0' }],
        ['an amount with a decimal point', { amount: '1.5' }],
        ['an amount in exponent notation', { amount: '1e8' }],
        ['a missing path', { path: undefined }],
        ['an empty path', { path: '' }],
        ['a path without hardened account parts', { path: 'm/44/0/0/0/0' }],
        ['a path with a chain other than 0 or 1', { path: "m/44'/0'/0'/2/0" }],
        ['a path that stops at the chain', { path: "m/44'/0'/0'/0" }],
        ['a path with a hardened address index', { path: "m/44'/0'/0'/0/0'" }],
    ])('rejects %s', (_description, overrides) => {
        expect(isWellFormedUtxo(untypedUtxo(overrides))).toBe(false);
    });
});

describe('isConfirmedUtxo', () => {
    it('accepts an output with a block height and at least one confirmation', () => {
        expect(isConfirmedUtxo(mockUtxo({ confirmations: 1, blockHeight: 800000 }))).toBe(true);
    });

    it.each<[string, Record<string, unknown>]>([
        ['zero confirmations', { confirmations: 0 }],
        ['a mempool height of -1', { blockHeight: -1 }],
        ['a height of zero', { blockHeight: 0 }],
        ['a missing confirmation count', { confirmations: undefined }],
        ['a missing height', { blockHeight: undefined }],
        ['a confirmation count that is not a number', { confirmations: '6' }],
    ])('treats %s as unconfirmed', (_description, overrides) => {
        expect(isConfirmedUtxo(untypedUtxo(overrides))).toBe(false);
    });
});
