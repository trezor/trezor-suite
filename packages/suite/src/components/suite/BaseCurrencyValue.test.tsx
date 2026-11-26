import '@suite-common/test-utils/globalOverrides';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type CoinDefinitionsDataRootState } from '@suite-common/token-definitions';
import { toTokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type CurrentRate, asTimestamp } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { BaseCurrencyValue } from './BaseCurrencyValue';
import { type MockSuiteState, mockInitialAppState } from '../../../mocks/mockInitialAppState';

const ethereum = asNetworkSymbol('eth');
const TOKEN = toTokenAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');

type State = Omit<MockSuiteState, 'tokenDefinitions'> & CoinDefinitionsDataRootState;

const loadingRate: CurrentRate = {
    lastTickerTimestamp: asTimestamp(1700000000000),
    lastSuccessfulFetchTimestamp: asTimestamp(1700000000000),
    isLoading: true,
    error: null,
    ticker: { symbol: ethereum, tokenAddress: TOKEN },
};

const getState = (rate: CurrentRate): State => ({
    ...mockInitialAppState,
    tokenDefinitions: { [ethereum]: { coin: { data: [TOKEN] } } },
    wallet: {
        ...mockInitialAppState.wallet,
        fiat: {
            ...mockInitialAppState.wallet.fiat,
            current: {
                [getFiatRateKey(ethereum, 'usd', TOKEN)]: rate,
            },
        },
    },
});

const renderValue = (element: React.ReactElement, rate: CurrentRate) => {
    const { services } = createTestCompositionRoot<void, State>({
        preloadedState: getState(rate),
    });

    return renderWithProviders(services, element);
};

const isSkeletonShown = (container: HTMLElement) =>
    container.querySelector('[data-component="Skeleton"]') !== null;

describe('BaseCurrencyValue', () => {
    it('shows the skeleton while the rate loads', () => {
        const { container } = renderValue(
            <BaseCurrencyValue
                amount="1"
                symbol={ethereum}
                tokenAddress={TOKEN}
                showLoadingSkeleton
            />,
            loadingRate,
        );

        expect(isSkeletonShown(container)).toBe(true);
    });

    it('hides the skeleton when the rate fetch failed', () => {
        const { container } = renderValue(
            <BaseCurrencyValue
                amount="1"
                symbol={ethereum}
                tokenAddress={TOKEN}
                showLoadingSkeleton
                isLoading
            />,
            { ...loadingRate, error: 'failed' },
        );

        expect(isSkeletonShown(container)).toBe(false);
    });

    it('passes the ticker timestamp to children', () => {
        const children = jest.fn(() => null);

        renderValue(
            <BaseCurrencyValue amount="1" symbol={ethereum} tokenAddress={TOKEN}>
                {children}
            </BaseCurrencyValue>,
            {
                ...loadingRate,
                isLoading: false,
                rate: 2,
                usdRate: 2,
                lastTickerTimestamp: asTimestamp(1700000000123),
            },
        );

        expect(children).toHaveBeenLastCalledWith(
            expect.objectContaining({ timestamp: 1700000000123 }),
        );
    });
});
