import { asNetworkSymbol } from '@suite-common/wallet-config';

import {
    type EvmAssetDiff,
    type NetworkTxSimulationResult,
    type SolanaAssetDiff,
    type StellarAssetDiff,
} from '../types';
import {
    getEvmAssetDiffValue,
    getSolanaAssetDiffValue,
    getStellarAssetDiffValue,
    getTxSimulationTokenSources,
} from './getAssetDiffTransferLabel';

const asEvmDiff = (diff: unknown) => diff as EvmAssetDiff;
const asSolanaDiff = (diff: unknown) => diff as SolanaAssetDiff;
const asStellarDiff = (diff: unknown) => diff as StellarAssetDiff;

const toPlain = ({ amount, contractAddress }: ReturnType<typeof getSolanaAssetDiffValue>) => ({
    amount: amount.toFixed(),
    contractAddress,
});

describe('getEvmAssetDiffValue', () => {
    it('converts the raw value of a token transfer with the asset decimals', () => {
        const diff = asEvmDiff({
            asset_type: 'ERC20',
            asset: { type: 'ERC20', address: '0xA0b8', symbol: 'USDC', decimals: 6 },
            in: [{ raw_value: '0x989680', value: '10.0', summary: 'Receiving 10 USDC' }],
            out: [],
        });

        expect(toPlain(getEvmAssetDiffValue(diff.asset, diff.in[0]!)!)).toEqual({
            amount: '10',
            contractAddress: '0xA0b8',
        });
    });

    it('returns no contract for the network coin', () => {
        const diff = asEvmDiff({
            asset_type: 'NATIVE',
            asset: { type: 'NATIVE', symbol: 'ETH', decimals: 18 },
            in: [],
            out: [{ raw_value: '0x8ac7230489e80000', value: '10.0' }],
        });

        expect(toPlain(getEvmAssetDiffValue(diff.asset, diff.out[0]!)!)).toEqual({
            amount: '10',
            contractAddress: undefined,
        });
    });

    it('leaves an NFT transfer to the provider summary', () => {
        const diff = asEvmDiff({
            asset_type: 'ERC721',
            asset: { type: 'ERC721', address: '0xBC4C', symbol: 'BAYC' },
            in: [{ token_id: '0x1', summary: 'Receiving BAYC #1' }],
            out: [],
        });

        expect(getEvmAssetDiffValue(diff.asset, diff.in[0]!)).toBeNull();
    });

    it('leaves a token without a symbol to the provider summary', () => {
        const diff = asEvmDiff({
            asset_type: 'ERC20',
            asset: { type: 'ERC20', address: '0xDEAD', decimals: 18 },
            in: [{ raw_value: '0x1', value: '0.000000000000000001' }],
            out: [],
        });

        expect(getEvmAssetDiffValue(diff.asset, diff.in[0]!)).toBeNull();
    });
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
