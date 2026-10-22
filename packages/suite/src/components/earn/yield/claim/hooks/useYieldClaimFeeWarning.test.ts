import { waitFor } from '@testing-library/react';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { type YieldAccountRewards } from '@suite-common/earn-stablecoin-api';
import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountWithNetworkType,
    asAccountDescriptor,
    asBaseCurrencyAmount,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type WithServices } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import { type AppState } from 'src/reducers/store';

import { useYieldClaimFeeWarning } from './useYieldClaimFeeWarning';

const mockEstimateYieldFeeLevel = jest.fn();

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    estimateYieldFeeLevel: (payload: unknown) => mockEstimateYieldFeeLevel(payload),
}));

const ETH_RATE = 3000;
const ethSymbol = asNetworkSymbol('eth');
const SENDER = '0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3';
const MORPHO_TOKEN = '0x58D97B57BB95320F9a05dC918Aef65434969c2B2';
const PROOF = ['0xd8f0361b28675e4ac82f066f7abdaaffaa6e0fbd418f60dca41ae70656edd18b'];
const GAS_LIMIT = '100000';
// 100000 gas × 20 gwei = 0.002 ETH ≈ $6, more than the $2.50 reward.
const EXPENSIVE_FEE_PER_UNIT = '20000000000';
// 100000 gas × 1 gwei = 0.0001 ETH ≈ $0.30, less than the $2.50 reward.
const CHEAP_FEE_PER_UNIT = '1000000000';

const mockState = {
    wallet: {
        settings: { localCurrency: 'usd' },
        fiat: { current: { 'eth-usd': { rate: ETH_RATE } } },
        fees: {},
    },
};

const account = mockWalletAccount({
    symbol: ethSymbol,
    descriptor: asAccountDescriptor(SENDER),
}) as AccountWithNetworkType<'ethereum'>;

const accountRewards: YieldAccountRewards = {
    account,
    rewards: [
        {
            root: '0xroot',
            amount: '2500000000000000000',
            claimed: '0',
            pending: '0',
            claimable: asBaseCurrencyAmount(new BigNumber('2500000000000000000')),
            token: { address: MORPHO_TOKEN, chainId: 1, symbol: 'MORPHO', decimals: 18 },
            proofs: PROOF,
            fiat: {
                amount: asBaseCurrencyAmount(new BigNumber('2.5')),
                claimed: asBaseCurrencyAmount(new BigNumber('0')),
                pending: asBaseCurrencyAmount(new BigNumber('0')),
                claimable: asBaseCurrencyAmount(new BigNumber('2.5')),
            },
        },
    ],
    totalClaimableFiatAmount: asBaseCurrencyAmount(new BigNumber('2.5')),
};

type RenderParams = Partial<Parameters<typeof useYieldClaimFeeWarning>[0]>;

const renderClaimFeeWarning = (params: RenderParams = {}) => {
    const { services } = createTestCompositionRoot<WithServices<DesktopAnalyticsDep>, AppState>({
        preloadedState: mockState,
        services: () => ({ analytics: mockDesktopAnalytics(jest.fn()) }),
    });

    return renderHookWithStoreProvider(
        () =>
            useYieldClaimFeeWarning({
                accountRewards,
                networkSymbol: ethSymbol,
                isClaimPending: false,
                ...params,
            }),
        { services },
    );
};

const mockFeeLevel = (feePerUnit: string) =>
    mockEstimateYieldFeeLevel.mockResolvedValue({
        success: true,
        payload: { feeLimit: GAS_LIMIT, feePerUnit },
    });

describe('useYieldClaimFeeWarning', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('warns when the estimated fee exceeds the claimable rewards', async () => {
        mockFeeLevel(EXPENSIVE_FEE_PER_UNIT);

        const { result } = renderClaimFeeWarning();

        await waitFor(() => expect(result.current).toBe('fee-exceeds-rewards'));
        expect(mockEstimateYieldFeeLevel).toHaveBeenCalledWith(
            expect.objectContaining({ coin: ethSymbol, from: SENDER }),
        );
    });

    it('does not warn when the estimated fee is below the claimable rewards', async () => {
        mockFeeLevel(CHEAP_FEE_PER_UNIT);

        const { result } = renderClaimFeeWarning();

        await waitFor(() => expect(mockEstimateYieldFeeLevel).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(result.current).toBeNull());
    });

    it('does not warn before the fee is estimated', () => {
        mockEstimateYieldFeeLevel.mockReturnValue(new Promise(() => {}));

        const { result } = renderClaimFeeWarning();

        expect(result.current).toBeNull();
    });

    it('does not warn or estimate while a claim is pending', () => {
        mockFeeLevel(EXPENSIVE_FEE_PER_UNIT);

        const { result } = renderClaimFeeWarning({ isClaimPending: true });

        expect(result.current).toBeNull();
        expect(mockEstimateYieldFeeLevel).not.toHaveBeenCalled();
    });

    it('does not warn when the fee estimation fails', async () => {
        mockEstimateYieldFeeLevel.mockResolvedValue({
            success: false,
            error: 'fee-estimation-failed',
        });

        const { result } = renderClaimFeeWarning();

        await waitFor(() => expect(mockEstimateYieldFeeLevel).toHaveBeenCalledTimes(1));
        expect(result.current).toBeNull();
    });
});
