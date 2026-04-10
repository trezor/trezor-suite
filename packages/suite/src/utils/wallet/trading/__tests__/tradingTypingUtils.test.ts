import { TRADING_EXCHANGE_FORM_CEX, TRADING_EXCHANGE_FORM_DEX } from '@suite-common/trading';

import { type TradingFormContextValues } from 'src/types/trading/tradingForm';
import { getSelectedQuote } from 'src/utils/wallet/trading/tradingTypingUtils';

describe('tradingTypingUtils', () => {
    describe(getSelectedQuote.name, () => {
        it('returns preselected quote before computing from lists', () => {
            const preselectedQuote = { orderId: 'preselected-1', exchange: 'invity' };
            const context = {
                type: 'buy',
                preselectedQuote,
                quotes: [{ orderId: 'quote-1', exchange: 'banxa', paymentMethod: 'card' }],
                getValues: () => ({ provider: 'banxa', paymentMethod: { value: 'card' } }),
            } as unknown as TradingFormContextValues<'buy'>;

            expect(getSelectedQuote(context)).toBe(preselectedQuote);
        });

        it('filters buy quotes by provider and payment method', () => {
            const buyQuotes = [
                { orderId: 'buy-1', exchange: 'banxa', paymentMethod: 'card' },
                { orderId: 'buy-2', exchange: 'moonpay', paymentMethod: 'card' },
                { orderId: 'buy-3', exchange: 'banxa', paymentMethod: 'bankTransfer' },
            ];

            const context = {
                type: 'buy',
                quotes: buyQuotes,
                getValues: () => ({ provider: 'banxa', paymentMethod: { value: 'card' } }),
            } as unknown as TradingFormContextValues<'buy'>;

            expect(getSelectedQuote(context)).toBe(buyQuotes[0]);
        });

        it('filters sell quotes by payment method when provider is not selected', () => {
            const sellQuotes = [
                { orderId: 'sell-1', exchange: 'provider-a', paymentMethod: 'card' },
                { orderId: 'sell-2', exchange: 'provider-b', paymentMethod: 'bankTransfer' },
            ];

            const context = {
                type: 'sell',
                quotes: sellQuotes,
                getValues: () => ({
                    provider: undefined,
                    paymentMethod: { value: 'bankTransfer' },
                }),
            } as unknown as TradingFormContextValues<'sell'>;

            expect(getSelectedQuote(context)).toBe(sellQuotes[1]);
        });

        it('selects exchange quote from dex quotes when exchange type is dex', () => {
            const dexQuotes = [
                { orderId: 'dex-1', exchange: '1inch' },
                { orderId: 'dex-2', exchange: '0x' },
            ];

            const context = {
                type: 'exchange',
                cexQuotes: [{ orderId: 'cex-1', exchange: 'changelly' }],
                dexQuotes,
                getValues: () => ({ provider: '0x', exchangeType: TRADING_EXCHANGE_FORM_DEX }),
            } as unknown as TradingFormContextValues<'exchange'>;

            expect(getSelectedQuote(context)).toBe(dexQuotes[1]);
        });

        it('falls back to first exchange quote when provider is not found', () => {
            const cexQuotes = [
                { orderId: 'cex-1', exchange: 'changelly' },
                { orderId: 'cex-2', exchange: 'invity' },
            ];

            const context = {
                type: 'exchange',
                cexQuotes,
                dexQuotes: [],
                getValues: () => ({
                    provider: 'missing-provider',
                    exchangeType: TRADING_EXCHANGE_FORM_CEX,
                }),
            } as unknown as TradingFormContextValues<'exchange'>;

            expect(getSelectedQuote(context)).toBe(cexQuotes[0]);
        });
    });
});
