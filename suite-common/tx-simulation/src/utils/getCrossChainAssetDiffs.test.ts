import { type TransactionSimulation } from '../types';
import { getCrossChainAssetDiffs } from './getCrossChainAssetDiffs';

const ACCOUNT = '0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3';
const BRIDGE_CONTRACT = '0x1111222233334444555566667777888899990000';

const hyperliquidOut = {
    chain: 'hyperliquid',
    asset_type: 'FUNGIBLE',
    asset: { type: 'ERC20', address: '0x6d1e7cde53ba9467b783cb7c530ce054', decimals: 8 },
    in: [],
    out: [{ value: '1.0', raw_value: '0x5f5e100' }],
};

const arbitrumIn = {
    chain: 'arbitrum',
    asset_type: 'FUNGIBLE',
    asset: { type: 'ERC20', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
    in: [{ usd_price: '0.99968199999999996', value: '1.0', raw_value: '0xf4240' }],
    out: [],
};

const createSimulation = (crossChainAssetDiffs: unknown): TransactionSimulation =>
    ({
        status: 'Success',
        account_summary: { assets_diffs: [], exposures: [] },
        transaction_actions: ['bridge'],
        cross_chain_asset_diffs: crossChainAssetDiffs,
    }) as unknown as TransactionSimulation;

describe('getCrossChainAssetDiffs', () => {
    it('returns both legs of the bridge for the scanned account', () => {
        const simulation = createSimulation({
            [ACCOUNT]: [hyperliquidOut, arbitrumIn],
            [BRIDGE_CONTRACT]: [{ ...hyperliquidOut, in: hyperliquidOut.out, out: [] }],
        });

        expect(getCrossChainAssetDiffs(simulation, ACCOUNT)).toEqual([hyperliquidOut, arbitrumIn]);
    });

    it('ignores the bridge contracts', () => {
        const simulation = createSimulation({
            [BRIDGE_CONTRACT]: [hyperliquidOut],
        });

        expect(getCrossChainAssetDiffs(simulation, ACCOUNT)).toEqual([]);
    });

    it('matches the account address regardless of checksum casing', () => {
        const simulation = createSimulation({ [ACCOUNT]: [arbitrumIn] });

        expect(getCrossChainAssetDiffs(simulation, ACCOUNT.toLowerCase())).toEqual([arbitrumIn]);
    });

    it('tolerates the array shape the SDK types declare', () => {
        const simulation = createSimulation([{ address: ACCOUNT, obj: [arbitrumIn] }]);

        expect(getCrossChainAssetDiffs(simulation, ACCOUNT)).toEqual([arbitrumIn]);
    });

    it.each([undefined, null])('returns nothing when the field is %s', diffs => {
        expect(getCrossChainAssetDiffs(createSimulation(diffs), ACCOUNT)).toEqual([]);
    });

    it('returns nothing without an account address', () => {
        const simulation = createSimulation({ [ACCOUNT]: [arbitrumIn] });

        expect(getCrossChainAssetDiffs(simulation, undefined)).toEqual([]);
    });
});
