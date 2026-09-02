import type { TradingTradeType } from '@suite-common/trading';
import {
    banxaCreditCardSellQuote,
    getInitializedTradingStateWithQuotes,
    mercuryoApplePayBuyQuote,
} from '@suite-native/trading-fixtures';

import { ProviderListItemAmount } from './ProviderListItemAmount';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

const overridesWithQuotes: PreloadedStatePartial<TradingTestPreloadedState> = {
    wallet: { trading: getInitializedTradingStateWithQuotes() },
};

// The user requested a crypto amount to receive ("to" side), so the fiat amount they pay is shown.
const buyWantCryptoOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
    wallet: {
        trading: {
            ...getInitializedTradingStateWithQuotes(),
            buy: {
                ...getInitializedTradingStateWithQuotes().buy,
                quotesRequest: {
                    wantCrypto: true,
                    receiveCurrency: mercuryoApplePayBuyQuote.receiveCurrency,
                    fiatCurrency: 'EUR',
                    cryptoStringAmount: mercuryoApplePayBuyQuote.receiveStringAmount,
                },
            },
        },
    },
};

// The user entered a crypto amount to sell ("from" side), so the fiat amount they receive is shown.
const sellAmountInCryptoOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
    wallet: {
        trading: {
            ...getInitializedTradingStateWithQuotes(),
            sell: {
                ...getInitializedTradingStateWithQuotes().sell,
                quotesRequest: {
                    amountInCrypto: true,
                    cryptoCurrency: banxaCreditCardSellQuote.cryptoCurrency,
                    fiatCurrency: 'USD',
                },
            },
        },
    },
};

describe('ProviderListItemAmount', () => {
    const renderProviderListItemAmount = async (
        quote: TradingTradeType,
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = overridesWithQuotes,
    ) => await renderWithTradingProvider(<ProviderListItemAmount quote={quote} />, { overrides });

    it('should render the received amount when the user entered the "from" amount', async () => {
        const { getByText } = await renderProviderListItemAmount(mercuryoApplePayBuyQuote);

        expect(getByText('0.00100016 BTC')).toBeOnTheScreen();
    });

    it('should render the fiat amount when the user requested a crypto ("to") amount for buy', async () => {
        const { getByText } = await renderProviderListItemAmount(
            mercuryoApplePayBuyQuote,
            buyWantCryptoOverrides,
        );

        expect(getByText('€10.00')).toBeOnTheScreen();
    });

    it('should render the received fiat amount when the user entered a crypto amount for sell', async () => {
        const { getByText } = await renderProviderListItemAmount(
            banxaCreditCardSellQuote,
            sellAmountInCryptoOverrides,
        );

        expect(getByText('$90.17')).toBeOnTheScreen();
    });

    it('should render nothing when the amount is missing', async () => {
        const quoteWithoutReceiveAmount = {
            ...mercuryoApplePayBuyQuote,
            receiveStringAmount: undefined,
        } as TradingTradeType;

        const { toJSON } = await renderProviderListItemAmount(quoteWithoutReceiveAmount);

        expect(toJSON()).toBeNull();
    });
});
