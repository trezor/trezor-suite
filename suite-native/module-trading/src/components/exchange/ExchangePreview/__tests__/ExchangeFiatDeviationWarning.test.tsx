import type { ExchangeTrade } from 'invity-api';

import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils';
import { mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';

import { ExchangeFiatDeviationWarning } from '../ExchangeFiatDeviationWarning';

const mockExchangeFiatDeviation = jest.fn();

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    useExchangeFiatDeviation: (...args: unknown[]) => mockExchangeFiatDeviation(...args),
}));

describe('ExchangeFiatDeviationWarning', () => {
    const renderExchangeFiatDeviationWarning = (quote?: ExchangeTrade) =>
        renderWithStoreProvider(<ExchangeFiatDeviationWarning quote={quote} />, {
            preloadedState: {
                wallet: { settings: { localCurrency: 'usd' } },
            },
        });

    beforeEach(() => {
        jest.clearAllMocks();

        mockExchangeFiatDeviation.mockReturnValue({
            deviation: 0.15,
            exceedsThreshold: true,
            exceedsHighThreshold: false,
        });
    });

    it('should render nothing when no quote is provided', () => {
        const { toJSON } = renderExchangeFiatDeviationWarning();

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when rate does not deviate', () => {
        mockExchangeFiatDeviation.mockReturnValue({
            deviation: 0.01,
            exceedsThreshold: false,
            exceedsHighThreshold: false,
        });

        const { toJSON } = renderExchangeFiatDeviationWarning(mercuryoFixedWorstQuote);

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when useExchangeFiatDeviation returns null', () => {
        mockExchangeFiatDeviation.mockReturnValue(null);

        const { toJSON } = renderExchangeFiatDeviationWarning(mercuryoFixedWorstQuote);

        expect(toJSON()).toBeNull();
    });

    it('should call useExchangeFiatDeviation with proper params', () => {
        const quote = mercuryoFixedWorstQuote;

        renderExchangeFiatDeviationWarning(quote);

        expect(mockExchangeFiatDeviation).toHaveBeenCalledWith({
            sendCryptoId: quote.send,
            sendAmount: quote.sendStringAmount,
            receiveCryptoId: quote.receive,
            receiveAmount: quote.receiveStringAmount,
            fiatCurrency: 'usd',
        });
    });

    it('should call display warning when threshold is exceeded', () => {
        const { getByText } = renderExchangeFiatDeviationWarning(mercuryoFixedWorstQuote);

        expect(
            getByText(
                getTranslation('moduleTrading.tradingExchangePreviewScreen.fiatDeviationWarning', {
                    percent: '15%',
                }),
            ),
        ).toBeOnTheScreen();
    });

    it('should call display error when high threshold is exceeded', () => {
        mockExchangeFiatDeviation.mockReturnValue({
            deviation: 0.25,
            exceedsThreshold: true,
            exceedsHighThreshold: true,
        });

        const { getByText } = renderExchangeFiatDeviationWarning(mercuryoFixedWorstQuote);

        expect(
            getByText(
                getTranslation('moduleTrading.tradingExchangePreviewScreen.fiatDeviationWarning', {
                    percent: '25%',
                }),
            ),
        ).toBeOnTheScreen();
    });
});
