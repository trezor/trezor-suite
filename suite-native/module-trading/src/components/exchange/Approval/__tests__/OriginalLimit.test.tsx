import type { ExchangeTrade } from 'invity-api';

import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { getWalletState } from '@suite-native/trading-fixtures';

import { OriginalLimit } from '../OriginalLimit';

const mockSelectTradingExchangeActiveQuote = jest.fn();

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    selectTradingExchangeActiveQuote: (...args: unknown[]) =>
        mockSelectTradingExchangeActiveQuote(...args),
}));

describe('OriginalLimit', () => {
    const renderOriginalLimit = () =>
        renderWithStoreProvider(<OriginalLimit />, {
            preloadedState: {
                wallet: getWalletState({
                    tradeType: 'exchange',
                }),
            },
            providers: ['intl', 'formatter'],
        });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each([
        ['quote is undefined', undefined],
        ['quote.send is undefined', { preapprovedStringAmount: '100' }],
        ['quote.preapprovedStringAmount is undefined', { send: 'bitcoin' }],
        [
            'quote.preapprovedStringAmount is empty string',
            { send: 'bitcoin', preapprovedStringAmount: '' },
        ],
        ['quote.preapprovedStringAmount is "0"', { send: 'bitcoin', preapprovedStringAmount: '0' }],
    ] as const)('should render nothing when %s', (_description, quote) => {
        mockSelectTradingExchangeActiveQuote.mockReturnValue(quote);

        const { toJSON } = renderOriginalLimit();

        expect(toJSON()).toBeNull();
    });

    it('should render limit label and amount when quote has valid data', () => {
        mockSelectTradingExchangeActiveQuote.mockReturnValue({
            send: 'bitcoin',
            preapprovedStringAmount: '100',
        } as Partial<ExchangeTrade>);

        const { getByText } = renderOriginalLimit();

        expect(
            getByText(
                getTranslation('moduleTrading.tradingExchangeApprovalScreen.currentLimitLabel'),
            ),
        ).toBeTruthy();
        expect(getByText('100 BTC')).toBeTruthy();
    });
});
