import type { CryptoId } from 'invity-api';

import { type NetworkTxSimulationResult } from '@suite-common/tx-simulation';

import { getSimulatedReceiveAmount } from './getSimulatedReceiveAmount';

const USDC_CONTRACT = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

const nativeAssetDiff = {
    asset_type: 'NATIVE',
    asset: { type: 'NATIVE', chain_id: 1, chain_name: 'ethereum', decimals: 18 },
    // 1 ETH
    in: [{ raw_value: '0xde0b6b3a7640000', value: '1' }],
    out: [],
};

const usdcAssetDiff = {
    asset_type: 'ERC20',
    asset: { type: 'ERC20', address: USDC_CONTRACT.toLowerCase(), decimals: 6 },
    // 250 USDC
    in: [{ raw_value: '0xee6b280', value: '250' }],
    out: [],
};

const createSimulationResult = (
    assetsDiffs: unknown[],
    { simulationStatus = 'Success' }: { simulationStatus?: 'Success' | 'Error' } = {},
): NetworkTxSimulationResult =>
    ({
        method: 'ethereumSignTransaction',
        payload: {
            needsDisclaimer: false,
            simulation: {
                status: simulationStatus,
                account_summary: { assets_diffs: assetsDiffs },
            },
        },
    }) as unknown as NetworkTxSimulationResult;

const nativeQuoteReceive: CryptoId = 'ethereum' as CryptoId;
const tokenQuoteReceive: CryptoId = `ethereum--${USDC_CONTRACT}` as CryptoId;

describe('getSimulatedReceiveAmount', () => {
    it('returns null without a simulation result', () => {
        expect(getSimulatedReceiveAmount(undefined, nativeQuoteReceive)).toBeNull();
    });

    it('returns null without a quote', () => {
        const result = createSimulationResult([nativeAssetDiff]);

        expect(getSimulatedReceiveAmount(result, undefined)).toBeNull();
    });

    it('returns null when the simulation errored', () => {
        const result = createSimulationResult([nativeAssetDiff], { simulationStatus: 'Error' });

        expect(getSimulatedReceiveAmount(result, nativeQuoteReceive)).toBeNull();
    });

    it('returns the incoming native amount for a native receive asset', () => {
        const result = createSimulationResult([usdcAssetDiff, nativeAssetDiff]);

        expect(getSimulatedReceiveAmount(result, nativeQuoteReceive)).toBe('1');
    });

    it('matches an ERC20 receive asset by contract address case-insensitively', () => {
        const result = createSimulationResult([nativeAssetDiff, usdcAssetDiff]);

        expect(getSimulatedReceiveAmount(result, tokenQuoteReceive)).toBe('250');
    });

    it('prefers exact raw_value math over the float-derived value', () => {
        // Real API sample: raw_value 0xed425 = 971813 subunits at 6 decimals
        // is exactly 0.971813, while `value` carries float noise.
        const result = createSimulationResult([
            {
                ...usdcAssetDiff,
                in: [{ raw_value: '0xed425', value: '0.971813000000000038' }],
            },
        ]);

        expect(getSimulatedReceiveAmount(result, tokenQuoteReceive)).toBe('0.971813');
    });

    it('sums multiple incoming transfers of the receive asset', () => {
        // 250 USDC + 50.5 USDC
        const result = createSimulationResult([
            {
                ...usdcAssetDiff,
                in: [{ raw_value: '0xee6b280' }, { raw_value: '0x30291a0' }],
            },
        ]);

        expect(getSimulatedReceiveAmount(result, tokenQuoteReceive)).toBe('300.5');
    });

    it('falls back to value when the asset decimals are unknown', () => {
        const result = createSimulationResult([
            {
                ...usdcAssetDiff,
                asset: { type: 'NONERC', address: USDC_CONTRACT.toLowerCase() },
                in: [{ raw_value: '0xee6b280', value: '250' }],
            },
        ]);

        expect(getSimulatedReceiveAmount(result, tokenQuoteReceive)).toBe('250');
    });

    it('returns null when the receive asset has no incoming transfer', () => {
        const result = createSimulationResult([{ ...nativeAssetDiff, in: [] }]);

        expect(getSimulatedReceiveAmount(result, nativeQuoteReceive)).toBeNull();
    });

    it('returns null when only other assets changed', () => {
        const result = createSimulationResult([usdcAssetDiff]);

        expect(getSimulatedReceiveAmount(result, nativeQuoteReceive)).toBeNull();
    });

    it('returns null when an incoming transfer cannot be valued', () => {
        const result = createSimulationResult([
            {
                ...usdcAssetDiff,
                asset: { type: 'NONERC', address: USDC_CONTRACT.toLowerCase() },
                in: [{ raw_value: '0xee6b280' }],
            },
        ]);

        expect(getSimulatedReceiveAmount(result, tokenQuoteReceive)).toBeNull();
    });
});
