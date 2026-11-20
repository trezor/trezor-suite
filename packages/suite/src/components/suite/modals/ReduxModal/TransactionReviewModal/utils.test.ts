import { type ExchangeTrade } from 'invity-api';

import { getTransactionReviewDeadline } from './utils';

const SELECTED_QUOTE_TIMESTAMP = new Date('2026-10-23T10:00:00Z').getTime();
const CREATED_TX_TIMESTAMP = SELECTED_QUOTE_TIMESTAMP + 20_000;

const providerBuiltQuote: ExchangeTrade = {
    isDex: true,
    dexTx: { from: 'from', to: 'to', data: 'AQAAAAAA', value: '0' },
};

describe('getTransactionReviewDeadline', () => {
    it('continues the offer review countdown for an exchange of a provider-built solana transaction', () => {
        expect(
            getTransactionReviewDeadline({
                networkType: 'solana',
                createdTxTimestamp: CREATED_TX_TIMESTAMP,
                isExchange: true,
                selectedQuote: providerBuiltQuote,
                selectedQuoteTimestamp: SELECTED_QUOTE_TIMESTAMP,
            }),
        ).toEqual({ deadline: SELECTED_QUOTE_TIMESTAMP + 30_000, shouldCheckTxTimeValidity: true });
    });

    it('keeps the signing budget for a solana exchange without a provider-built transaction', () => {
        expect(
            getTransactionReviewDeadline({
                networkType: 'solana',
                createdTxTimestamp: CREATED_TX_TIMESTAMP,
                isExchange: true,
                selectedQuote: {
                    isDex: true,
                    dexTx: { from: 'from', to: 'to', data: '', value: '1' },
                },
                selectedQuoteTimestamp: SELECTED_QUOTE_TIMESTAMP,
            }),
        ).toEqual({ deadline: CREATED_TX_TIMESTAMP + 24_000, shouldCheckTxTimeValidity: true });
    });

    it('ignores a leftover exchange quote when the review is not an exchange', () => {
        expect(
            getTransactionReviewDeadline({
                networkType: 'solana',
                createdTxTimestamp: CREATED_TX_TIMESTAMP,
                isExchange: false,
                selectedQuote: providerBuiltQuote,
                selectedQuoteTimestamp: SELECTED_QUOTE_TIMESTAMP,
            }),
        ).toEqual({ deadline: CREATED_TX_TIMESTAMP + 24_000, shouldCheckTxTimeValidity: true });
    });

    it('does not check the validity without a composed solana transaction', () => {
        expect(
            getTransactionReviewDeadline({
                networkType: 'solana',
                createdTxTimestamp: 0,
                isExchange: false,
                selectedQuote: undefined,
                selectedQuoteTimestamp: undefined,
            }).shouldCheckTxTimeValidity,
        ).toBe(false);
    });

    it('does not check the validity outside solana', () => {
        expect(
            getTransactionReviewDeadline({
                networkType: 'ethereum',
                createdTxTimestamp: CREATED_TX_TIMESTAMP,
                isExchange: true,
                selectedQuote: providerBuiltQuote,
                selectedQuoteTimestamp: SELECTED_QUOTE_TIMESTAMP,
            }).shouldCheckTxTimeValidity,
        ).toBe(false);
    });
});
