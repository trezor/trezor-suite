import { asNetworkSymbol } from '@suite-common/wallet-config';

import {
    type NetworkTxSimulationResult,
    type SolanaAssetDiff,
    type StellarAssetDiff,
} from '../types';
import {
    getSolanaAssetDiffValue,
    getStellarAssetDiffValue,
    getTxSimulationTokenSources,
} from './getAssetDiffTransferLabel';

const asSolanaDiff = (diff: unknown) => diff as SolanaAssetDiff;
const asStellarDiff = (diff: unknown) => diff as StellarAssetDiff;

const toPlain = ({ amount, contractAddress }: ReturnType<typeof getSolanaAssetDiffValue>) => ({
    amount: amount.toFixed(),
    contractAddress,
});

describe('getSolanaAssetDiffValue', () => {
    it('converts the raw value with the asset decimals', () => {
        const diff = asSolanaDiff({
            asset: { type: 'SOL', symbol: 'SOL', decimals: 9 },
            out: { value: 0.004110331, raw_value: 4110331, summary: 'Lost approximately 0.42$' },
        });

        expect(toPlain(getSolanaAssetDiffValue(diff, diff.out!))).toEqual({
            amount: '0.004110331',
            contractAddress: undefined,
        });
    });

    it('keeps small amounts out of exponential notation', () => {
        const diff = asSolanaDiff({
            asset: { type: 'TOKEN', symbol: 'WSOL', address: 'So111', decimals: 9 },
            in: { value: 1.515e-6, raw_value: 1515 },
        });

        expect(toPlain(getSolanaAssetDiffValue(diff, diff.in!))).toEqual({
            amount: '0.000001515',
            contractAddress: 'So111',
        });
    });

    it('falls back to the network symbol when the asset has none', () => {
        const diff = asSolanaDiff({
            asset: { type: 'NFT', address: 'CTPoy' },
            in: { value: 1, raw_value: 1 },
        });

        expect(toPlain(getSolanaAssetDiffValue(diff, diff.in!))).toEqual({
            amount: '1',
            contractAddress: undefined,
        });
    });
});

describe('getStellarAssetDiffValue', () => {
    it('converts the stroop count instead of the rounded value', () => {
        const diff = asStellarDiff({
            asset: { type: 'ASSET', code: 'USDC', issuer: 'GA5Z' },
            out: { value: 12.5, raw_value: 125000001 },
        });

        expect(toPlain(getStellarAssetDiffValue(diff, diff.out!))).toEqual({
            amount: '12.5000001',
            contractAddress: 'USDC-GA5Z',
        });
    });

    it('keeps amounts Blockaid rounds down to zero', () => {
        const diff = asStellarDiff({
            asset: { type: 'ASSET', code: 'yBTC', issuer: 'GBUY' },
            in: { value: 0, raw_value: 4 },
        });

        expect(toPlain(getStellarAssetDiffValue(diff, diff.in!))).toEqual({
            amount: '0.0000004',
            contractAddress: 'yBTC-GBUY',
        });
    });

    it('identifies a contract token by its address', () => {
        const diff = asStellarDiff({
            asset: { type: 'CONTRACT', symbol: 'AQUA', name: 'Aquarius', address: 'CBQ' },
            in: { value: 3, raw_value: 30000000 },
        });

        expect(toPlain(getStellarAssetDiffValue(diff, diff.in!))).toEqual({
            amount: '3',
            contractAddress: 'CBQ',
        });
    });

    it('falls back to the network symbol for the native asset without a code', () => {
        const diff = asStellarDiff({
            asset: { type: 'NATIVE' },
            in: { value: 7, raw_value: 70000000 },
        });

        expect(toPlain(getStellarAssetDiffValue(diff, diff.in!))).toEqual({
            amount: '7',
            contractAddress: undefined,
        });
    });
});

describe('getTxSimulationTokenSources', () => {
    it('lists the simulated tokens and leaves out the network coin', () => {
        const result = {
            method: 'stellarSignTransaction',
            payload: {
                simulation: {
                    status: 'Success',
                    account_summary: {
                        account_assets_diffs: [
                            { asset: { type: 'ASSET', code: 'USDC', issuer: 'GA5Z' } },
                            { asset: { type: 'NATIVE' } },
                        ],
                    },
                },
            },
        } as unknown as NetworkTxSimulationResult;

        expect(getTxSimulationTokenSources(result, asNetworkSymbol('xlm'))).toEqual([
            { networkSymbol: 'xlm', tokens: [{ contract: 'USDC-GA5Z', symbol: 'USDC' }] },
        ]);
    });
});
