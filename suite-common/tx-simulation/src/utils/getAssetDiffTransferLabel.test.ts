import { asNetworkSymbol } from '@suite-common/wallet-config';

import { type SolanaAssetDiff, type StellarAssetDiff } from '../types';
import { getSolanaAssetDiffLabel, getStellarAssetDiffLabel } from './getAssetDiffTransferLabel';

const asSolanaDiff = (diff: unknown) => diff as SolanaAssetDiff;
const asStellarDiff = (diff: unknown) => diff as StellarAssetDiff;
const solSymbol = asNetworkSymbol('sol');
const dsolSymbol = asNetworkSymbol('dsol');
const xlmSymbol = asNetworkSymbol('xlm');

describe('getSolanaAssetDiffLabel', () => {
    it('converts the raw value with the asset decimals', () => {
        const diff = asSolanaDiff({
            asset: { type: 'SOL', symbol: 'SOL', decimals: 9 },
            out: { value: 0.004110331, raw_value: 4110331, summary: 'Lost approximately 0.42$' },
        });

        expect(getSolanaAssetDiffLabel(diff, diff.out!, solSymbol)).toBe('0.004110331 SOL');
    });

    it('keeps small amounts out of exponential notation', () => {
        const diff = asSolanaDiff({
            asset: { type: 'TOKEN', symbol: 'WSOL', address: 'So111', decimals: 9 },
            in: { value: 1.515e-6, raw_value: 1515 },
        });

        expect(getSolanaAssetDiffLabel(diff, diff.in!, solSymbol)).toBe('0.000001515 WSOL');
    });

    it('falls back to the network symbol when the asset has none', () => {
        const diff = asSolanaDiff({
            asset: { type: 'NFT', address: 'CTPoy' },
            in: { value: 1, raw_value: 1 },
        });

        expect(getSolanaAssetDiffLabel(diff, diff.in!, dsolSymbol)).toBe('1 dSOL');
    });
});

describe('getStellarAssetDiffLabel', () => {
    it('converts the stroop count instead of the rounded value', () => {
        const diff = asStellarDiff({
            asset: { type: 'ASSET', code: 'USDC', issuer: 'GA5Z' },
            out: { value: 12.5, raw_value: 125000001 },
        });

        expect(getStellarAssetDiffLabel(diff, diff.out!, xlmSymbol)).toBe('12.5000001 USDC');
    });

    it('keeps amounts Blockaid rounds down to zero', () => {
        const diff = asStellarDiff({
            asset: { type: 'ASSET', code: 'yBTC', issuer: 'GBUY' },
            in: { value: 0, raw_value: 4 },
        });

        expect(getStellarAssetDiffLabel(diff, diff.in!, xlmSymbol)).toBe('0.0000004 yBTC');
    });

    it('prefers the contract symbol', () => {
        const diff = asStellarDiff({
            asset: { type: 'CONTRACT', symbol: 'AQUA', name: 'Aquarius', address: 'CBQ' },
            in: { value: 3, raw_value: 30000000 },
        });

        expect(getStellarAssetDiffLabel(diff, diff.in!, xlmSymbol)).toBe('3 AQUA');
    });

    it('falls back to the network symbol for the native asset without a code', () => {
        const diff = asStellarDiff({
            asset: { type: 'NATIVE' },
            in: { value: 7, raw_value: 70000000 },
        });

        expect(getStellarAssetDiffLabel(diff, diff.in!, xlmSymbol)).toBe('7 XLM');
    });
});
