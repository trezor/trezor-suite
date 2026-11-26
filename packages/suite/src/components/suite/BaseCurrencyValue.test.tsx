import '@suite-common/test-utils/globalOverrides';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type TokenDefinitionsState } from '@suite-common/token-definitions';
import { type TokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type CurrentRate, asTimestamp } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { BaseCurrencyValue } from './BaseCurrencyValue';
import { type MockSuiteState, mockInitialAppState } from '../../../mocks/mockInitialAppState';

const ethereum = asNetworkSymbol('eth');
const TOKEN = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;

const getState = (rate: Partial<CurrentRate>): MockSuiteState => ({
    ...mockInitialAppState,
    tokenDefinitions: {
        eth: { coin: { data: [TOKEN] } },
    } as unknown as Partial<TokenDefinitionsState>,
    wallet: {
        ...mockInitialAppState.wallet,
        fiat: {
            ...mockInitialAppState.wallet.fiat,
            current: {
                [getFiatRateKey(ethereum, 'usd', TOKEN)]: {
                    lastTickerTimestamp: asTimestamp(1700000000000),
                    lastSuccessfulFetchTimestamp: asTimestamp(1700000000000),
                    isLoading: false,
                    error: null,
                    ticker: { symbol: ethereum, tokenAddress: TOKEN },
                    ...rate,
                } as CurrentRate,
            },
        },
    },
});

const renderValue = (element: React.ReactElement, rate: Partial<CurrentRate>) => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({
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
            { isLoading: true },
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
            { isLoading: true, error: 'failed' },
        );

        expect(isSkeletonShown(container)).toBe(false);
    });

    it('passes the ticker timestamp to children', () => {
        const children = jest.fn(() => null);

        renderValue(
            <BaseCurrencyValue amount="1" symbol={ethereum} tokenAddress={TOKEN}>
                {children}
            </BaseCurrencyValue>,
            { rate: 2, usdRate: 2, lastTickerTimestamp: asTimestamp(1700000000123) },
        );

        expect(children).toHaveBeenLastCalledWith(
            expect.objectContaining({ timestamp: 1700000000123 }),
        );
    });
});
