import { type FeeLevel } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import {
    FALLBACK_YIELD_GAS_RESERVE,
    getYieldGasReserve,
    getYieldNativeFeeStatus,
    roundUpToAmountLadder,
} from './yieldGasReserve';

const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const USDC_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const USDT_ADDRESS = '0xdac17f958d2ee523a2206206994597c13d831ec7';

// Fee levels are the converted ones from `selectConvertedNetworkFeeInfo`, i.e. in gwei.
const legacyFeeLevel = (feePerUnit: string): FeeLevel => ({
    label: 'normal',
    feePerUnit,
    blocks: 2,
});

const eip1559FeeLevel = (maxFeePerGas: string, feePerUnit = '0.1'): FeeLevel => ({
    label: 'normal',
    feePerUnit,
    blocks: 2,
    maxFeePerGas,
    maxPriorityFeePerGas: '0.05',
    baseFeePerGas: '0.5',
});

describe('roundUpToAmountLadder', () => {
    it.each([
        ['0.0011', '0.002'],
        ['0.0015', '0.002'],
        ['0.002', '0.002'],
        ['0.0021', '0.005'],
        ['0.005', '0.005'],
        ['0.0051', '0.01'],
        ['0.099', '0.1'],
        ['0.11', '0.2'],
        ['0.21', '0.5'],
        ['0.51', '1'],
        ['1', '1'],
        ['3', '5'],
        ['7', '10'],
        ['0.000011', '0.00002'],
    ])('rounds %s up to %s', (value, expected) => {
        expect(roundUpToAmountLadder(new BigNumber(value)).toString()).toBe(expected);
    });

    it('returns zero for zero, negative and non-finite values', () => {
        expect(roundUpToAmountLadder(new BigNumber(0)).toString()).toBe('0');
        expect(roundUpToAmountLadder(new BigNumber(-1)).toString()).toBe('0');
        expect(roundUpToAmountLadder(new BigNumber(NaN)).toString()).toBe('0');
        expect(roundUpToAmountLadder(new BigNumber(Infinity)).toString()).toBe('0');
    });
});

describe('getYieldGasReserve', () => {
    it('returns null without a fee level', () => {
        expect(
            getYieldGasReserve({
                feeLevel: null,
                isWrappedNativeVault: true,
                tokenContractAddress: WETH_ADDRESS,
            }),
        ).toBeNull();
        expect(
            getYieldGasReserve({
                feeLevel: undefined,
                isWrappedNativeVault: false,
                tokenContractAddress: USDC_ADDRESS,
            }),
        ).toBeNull();
    });

    it('returns null for a zero or malformed fee', () => {
        expect(
            getYieldGasReserve({
                feeLevel: legacyFeeLevel('0'),
                isWrappedNativeVault: false,
                tokenContractAddress: USDC_ADDRESS,
            }),
        ).toBeNull();
        expect(
            getYieldGasReserve({
                feeLevel: legacyFeeLevel('abc'),
                isWrappedNativeVault: false,
                tokenContractAddress: USDC_ADDRESS,
            }),
        ).toBeNull();
        expect(
            getYieldGasReserve({
                feeLevel: legacyFeeLevel('-1'),
                isWrappedNativeVault: false,
                tokenContractAddress: USDC_ADDRESS,
            }),
        ).toBeNull();
    });

    // Wrapped-native vault at 1 gwei: entry = (50k + 55k + 600k) × 1.25 = 881,250 gas → 0.00088 ETH
    // → 0.001; recommended adds exit = (600k + 35k) × 2.5 = 1,587,500 gas → 0.00247 ETH → 0.005.
    it('sizes the wrapped-native vault reserve from wrap + approve + deposit and withdraw + unwrap', () => {
        expect(
            getYieldGasReserve({
                feeLevel: legacyFeeLevel('1'),
                isWrappedNativeVault: true,
                tokenContractAddress: WETH_ADDRESS,
            }),
        ).toEqual({ minimum: '0.001', recommended: '0.005' });
    });

    // Token vault at 1 gwei: entry = (55k + 600k) × 1.25 = 818,750 gas → 0.00082 ETH → 0.001;
    // recommended adds exit = 600k × 2.5 = 1,500,000 gas → 0.00232 ETH → 0.005.
    it('sizes the token vault reserve without the wrap and unwrap steps', () => {
        expect(
            getYieldGasReserve({
                feeLevel: legacyFeeLevel('1'),
                isWrappedNativeVault: false,
                tokenContractAddress: USDC_ADDRESS,
            }),
        ).toEqual({ minimum: '0.001', recommended: '0.005' });
    });

    // USDT needs an allowance reset before a new approval, so two approve transactions are budgeted:
    // entry = (2 × 55k + 600k) × 1.25 = 887,500 gas; at 2 gwei → 0.001775 ETH → 0.002, while a single
    // approve at the same fee gives 0.0016375 ETH → 0.002 as well, so compare at 2.3 gwei instead:
    // USDT 0.00204 → 0.005 vs USDC 0.00188 → 0.002.
    it('budgets a second approve for tokens that require an allowance reset', () => {
        expect(
            getYieldGasReserve({
                feeLevel: legacyFeeLevel('2.3'),
                isWrappedNativeVault: false,
                tokenContractAddress: USDT_ADDRESS,
            })?.minimum,
        ).toBe('0.005');
        expect(
            getYieldGasReserve({
                feeLevel: legacyFeeLevel('2.3'),
                isWrappedNativeVault: false,
                tokenContractAddress: USDC_ADDRESS,
            })?.minimum,
        ).toBe('0.002');
    });

    it('prefers the EIP-1559 max fee per gas over the legacy fee per unit', () => {
        expect(
            getYieldGasReserve({
                feeLevel: eip1559FeeLevel('1'),
                isWrappedNativeVault: true,
                tokenContractAddress: WETH_ADDRESS,
            }),
        ).toEqual({ minimum: '0.001', recommended: '0.005' });
    });

    it('falls back to the legacy fee per unit when the EIP-1559 fields are missing', () => {
        expect(
            getYieldGasReserve({
                feeLevel: { ...legacyFeeLevel('1'), maxFeePerGas: undefined },
                isWrappedNativeVault: true,
                tokenContractAddress: WETH_ADDRESS,
            }),
        ).toEqual({ minimum: '0.001', recommended: '0.005' });
    });

    // 100 gwei: minimum 0.088 ETH → 0.1; recommended 0.247 ETH → 0.5, capped to 0.2.
    it('scales with the fee and hits the cap on a 100 gwei spike', () => {
        expect(
            getYieldGasReserve({
                feeLevel: legacyFeeLevel('100'),
                isWrappedNativeVault: true,
                tokenContractAddress: WETH_ADDRESS,
            }),
        ).toEqual({ minimum: '0.1', recommended: '0.2' });
    });

    it('clamps to the cap on a fee-oracle outlier', () => {
        expect(
            getYieldGasReserve({
                feeLevel: legacyFeeLevel('100000'),
                isWrappedNativeVault: true,
                tokenContractAddress: WETH_ADDRESS,
            }),
        ).toEqual({ minimum: '0.2', recommended: '0.2' });
    });

    it('clamps to the floor at sub-gwei fees', () => {
        expect(
            getYieldGasReserve({
                feeLevel: legacyFeeLevel('0.01'),
                isWrappedNativeVault: true,
                tokenContractAddress: WETH_ADDRESS,
            }),
        ).toEqual({ minimum: '0.0005', recommended: '0.0005' });
    });

    it('matches the E2E mock fee of 1.204475559 gwei', () => {
        expect(
            getYieldGasReserve({
                feeLevel: legacyFeeLevel('1.204475559'),
                isWrappedNativeVault: true,
                tokenContractAddress: WETH_ADDRESS,
            }),
        ).toEqual({ minimum: '0.002', recommended: '0.005' });
    });

    it('exposes the static fallback for both tiers', () => {
        expect(FALLBACK_YIELD_GAS_RESERVE).toEqual({ minimum: '0.005', recommended: '0.005' });
    });
});

describe('getYieldNativeFeeStatus', () => {
    const reserve = { minimum: '0.002', recommended: '0.005' };

    describe('wrap step', () => {
        const getStatus = (nativeBalance: string) =>
            getYieldNativeFeeStatus({
                nativeBalance,
                reserve,
                isWrapStep: true,
                isWrappedNativeVault: true,
            });

        it('is insufficient while the balance does not exceed the recommended reserve', () => {
            expect(getStatus('0')).toBe('insufficient');
            expect(getStatus('0.003')).toBe('insufficient');
            expect(getStatus('0.005')).toBe('insufficient');
        });

        it('is sufficient once there is something to wrap above the reserve', () => {
            expect(getStatus('0.005000000000000001')).toBe('sufficient');
            expect(getStatus('1')).toBe('sufficient');
        });

        it('treats an empty or malformed balance as insufficient', () => {
            expect(getStatus('')).toBe('insufficient');
            expect(getStatus('abc')).toBe('insufficient');
        });
    });

    describe('approve and deposit steps of a token vault', () => {
        const getStatus = (nativeBalance: string) =>
            getYieldNativeFeeStatus({
                nativeBalance,
                reserve,
                isWrapStep: false,
                isWrappedNativeVault: false,
            });

        it('is insufficient below the minimum reserve', () => {
            expect(getStatus('0')).toBe('insufficient');
            expect(getStatus('0.0019')).toBe('insufficient');
        });

        it('is below the recommendation between the minimum and recommended reserve', () => {
            expect(getStatus('0.002')).toBe('below-recommended');
            expect(getStatus('0.0049')).toBe('below-recommended');
        });

        it('is sufficient from the recommended reserve up', () => {
            expect(getStatus('0.005')).toBe('sufficient');
            expect(getStatus('1')).toBe('sufficient');
        });
    });

    describe('approve and deposit steps of a wrapped-native vault', () => {
        const getStatus = (nativeBalance: string) =>
            getYieldNativeFeeStatus({
                nativeBalance,
                reserve,
                isWrapStep: false,
                isWrappedNativeVault: true,
            });

        it('blocks below the minimum reserve', () => {
            expect(getStatus('0.0019')).toBe('insufficient');
        });

        // The wrap step already kept the recommended reserve aside, and the wrap fee then eats
        // into it, so recommending a top-up right after would contradict the Max the flow offered.
        it('never recommends a top-up', () => {
            expect(getStatus('0.002')).toBe('sufficient');
            expect(getStatus('0.0049')).toBe('sufficient');
            expect(getStatus('1')).toBe('sufficient');
        });
    });
});
