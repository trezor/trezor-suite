import type { ExchangeTrade } from 'invity-api';

import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { getWalletState } from '@suite-native/trading-fixtures';

import { OriginalLimit } from './OriginalLimit';

const mockSelectTradingExchangeSelectedQuote = jest.fn();

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    selectTradingExchangeSelectedQuote: (...args: unknown[]) =>
        mockSelectTradingExchangeSelectedQuote(...args),
}));

describe('OriginalLimit', () => {
    const renderOriginalLimit = async () =>
        await renderWithStoreProvider(<OriginalLimit />, {
            preloadedState: {
                wallet: getWalletState({
                    tradeType: 'exchange',
                }),
            },
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
    ] as const)('should render nothing when %s', async (_description, quote) => {
        mockSelectTradingExchangeSelectedQuote.mockReturnValue(quote);

        const { toJSON } = await renderOriginalLimit();

        expect(toJSON()).toBeNull();
    });

    it('should render limit label and amount when quote has valid data', async () => {
        mockSelectTradingExchangeSelectedQuote.mockReturnValue({
            send: 'bitcoin',
            preapprovedStringAmount: '100',
        } as Partial<ExchangeTrade>);

        const { getByText } = await renderOriginalLimit();

        expect(
            getByText(
                getTranslation('moduleTrading.tradingExchangeApprovalScreen.currentLimitLabel'),
            ),
        ).toBeTruthy();
        expect(getByText('100 BTC')).toBeTruthy();
    });
});
