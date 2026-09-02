import { mercuryoApplePayBuyQuote } from '@suite-native/trading-fixtures';

import { RequestedAmountShortfallNote } from './RequestedAmountShortfallNote';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

describe('RequestedAmountShortfallNote', () => {
    const renderNote = async (
        quote: typeof mercuryoApplePayBuyQuote,
        overrides: PreloadedStatePartial<TradingTestPreloadedState>,
    ) =>
        await renderWithTradingProvider(<RequestedAmountShortfallNote quote={quote} />, {
            overrides,
        });

    it('renders a fiat shortfall formatted in the quote fiat currency', async () => {
        const quote = { ...mercuryoApplePayBuyQuote, fiatStringAmount: '8' };

        const { getByText } = await renderNote(quote, {
            wallet: {
                trading: {
                    buy: {
                        quotesRequest: {
                            wantCrypto: false,
                            receiveCurrency: quote.receiveCurrency,
                            fiatCurrency: 'USD',
                            fiatStringAmount: '10',
                        },
                    },
                },
            },
        });

        expect(getByText('20% less to receive than requested (€2.00)')).toBeOnTheScreen();
    });

    it('renders nothing when there is a fiat shortfall but the quote has no fiat currency', async () => {
        const quote = {
            ...mercuryoApplePayBuyQuote,
            fiatCurrency: undefined,
            fiatStringAmount: '8',
        };

        const { toJSON } = await renderNote(quote, {
            wallet: {
                trading: {
                    buy: {
                        quotesRequest: {
                            wantCrypto: false,
                            receiveCurrency: quote.receiveCurrency,
                            fiatCurrency: 'USD',
                            fiatStringAmount: '10',
                        },
                    },
                },
            },
        });

        expect(toJSON()).toBeNull();
    });

    it('renders a crypto shortfall amount when the user requested a fixed crypto amount', async () => {
        const quote = { ...mercuryoApplePayBuyQuote, receiveStringAmount: '0.001' };

        const { getByText } = await renderNote(quote, {
            wallet: {
                trading: {
                    buy: {
                        quotesRequest: {
                            wantCrypto: true,
                            receiveCurrency: quote.receiveCurrency,
                            fiatCurrency: 'EUR',
                            cryptoStringAmount: '0.002',
                        },
                    },
                },
            },
        });

        expect(getByText('50% less to receive than requested (0.001 BTC)')).toBeOnTheScreen();
    });

    it('renders nothing when there is no requested amount shortfall', async () => {
        const { toJSON } = await renderNote(mercuryoApplePayBuyQuote, {});

        expect(toJSON()).toBeNull();
    });
});
