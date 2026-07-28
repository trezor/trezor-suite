import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import {
    type PreloadedStatePartial,
    mergePreloadedState,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import {
    cexdirectCreditCardBuyQuote,
    getWalletState,
    mercuryoApplePayBuyQuote,
} from '@suite-native/trading-fixtures';

import { useBuyAnalyticReportCallback } from './useBuyAnalyticReportCallback';

const reportMock = jest.fn();
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(reportMock),
};

describe('useBuyAnalyticReportCallback', () => {
    type BuyAnalyticsPreloadedState = {
        wallet: ReturnType<typeof getWalletState>;
    };

    const createPreloadedState = (
        overrides: PreloadedStatePartial<BuyAnalyticsPreloadedState> = {},
    ): BuyAnalyticsPreloadedState =>
        mergePreloadedState({ wallet: getWalletState({ tradeType: 'buy' }) }, overrides);

    const renderUseBuyAnalyticReportCallback = ({
        candidateQuote: initialCandidateQuote,
        preloadedState = createPreloadedState(),
    }: {
        candidateQuote?: Parameters<typeof useBuyAnalyticReportCallback>[0];
        preloadedState?: BuyAnalyticsPreloadedState;
    } = {}) =>
        renderHookWithStoreProvider(
            ({ candidateQuote }) => useBuyAnalyticReportCallback(candidateQuote),
            {
                preloadedState,
                services,
                initialProps: {
                    candidateQuote: initialCandidateQuote,
                },
            },
        );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call analytics with correct payload when persisted quote and coinInfo are present', () => {
        const { result } = renderUseBuyAnalyticReportCallback({
            preloadedState: createPreloadedState({
                wallet: {
                    trading: {
                        buy: {
                            selectedQuote: mercuryoApplePayBuyQuote,
                        },
                    },
                },
            }),
        });

        result.current('buy-preview', 'visit');

        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingBuyEvent.name,
            payload: expect.objectContaining({
                step: 'buy-preview',
                action: 'visit',
                exchangeName: 'mercuryo',
                cryptoNetworkSymbol: 'btc',
            }),
        });
    });

    it('should prefer candidateQuote over persisted quote', () => {
        const { result } = renderUseBuyAnalyticReportCallback({
            candidateQuote: cexdirectCreditCardBuyQuote,
            preloadedState: createPreloadedState({
                wallet: {
                    trading: {
                        buy: {
                            selectedQuote: mercuryoApplePayBuyQuote,
                        },
                    },
                },
            }),
        });

        result.current('buy-form', 'continue');

        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingBuyEvent.name,
            payload: expect.objectContaining({
                step: 'buy-form',
                action: 'continue',
                exchangeName: 'cexdirect',
            }),
        });
    });
});
