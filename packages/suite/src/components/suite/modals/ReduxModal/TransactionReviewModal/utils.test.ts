import { type CryptoId, type ExchangeTrade } from 'invity-api';

import { type TradingRootState, initialState as tradingInitialState } from '@suite-common/trading';
import { DEFAULT_VALUES } from '@suite-common/wallet-constants';
import {
    type SendState,
    type YieldRootState,
    initialStablecoinYieldState,
} from '@suite-common/wallet-core';
import { type FormState } from '@suite-common/wallet-types';
import { buildApprovalTransactionData } from '@suite-common/wallet-utils';

import { selectTxType } from './utils';

const DEX_SPENDER = '0x1111111111111111111111111111111111111111';
const OTHER_SPENDER = '0x2222222222222222222222222222222222222222';

const sendState: SendState = { drafts: {} };

const sendForm: FormState = {
    ...DEFAULT_VALUES,
    options: ['broadcast'],
    outputs: [],
    selectedUtxos: [],
};

const getApprovalForm = (spender: string): FormState => ({
    ...sendForm,
    transactionData: buildApprovalTransactionData({ amount: '1', spender }),
});

const getQuote = (isDex: boolean): ExchangeTrade => ({
    exchange: 'testExchange',
    quoteId: 'quote-1',
    send: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CryptoId,
    receive: 'ethereum' as CryptoId,
    sendStringAmount: '1',
    isDex,
    dexTx: {
        from: '0x3333333333333333333333333333333333333333',
        to: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        value: '0',
        data: buildApprovalTransactionData({ amount: '1', spender: DEX_SPENDER }),
    },
});

const getState = (selectedQuote?: ExchangeTrade): YieldRootState & TradingRootState => ({
    wallet: {
        stablecoinYield: initialStablecoinYieldState,
        trading: {
            ...tradingInitialState,
            exchange: { ...tradingInitialState.exchange, selectedQuote },
        },
    },
});

describe(selectTxType.name, () => {
    it.each([
        { activeSection: 'sell', isDex: false, expected: 'trade-cex' },
        { activeSection: 'exchange', isDex: false, expected: 'trade-cex' },
        { activeSection: 'exchange', isDex: true, expected: 'trade-dex' },
    ] as const)(
        'should return $expected for $activeSection with isDex $isDex',
        ({ activeSection, isDex, expected }) => {
            const form: FormState = {
                ...sendForm,
                trading: { activeSection, isSlip24Active: false },
            };

            expect(selectTxType(getState(getQuote(isDex)), sendState, form)).toBe(expected);
        },
    );

    it('should return trade-dex for an approval of the selected DEX quote spender', () => {
        expect(
            selectTxType(getState(getQuote(true)), sendState, getApprovalForm(DEX_SPENDER)),
        ).toBe('trade-dex');
    });

    it('should return undefined for an approval of a different spender', () => {
        expect(
            selectTxType(getState(getQuote(true)), sendState, getApprovalForm(OTHER_SPENDER)),
        ).toBeUndefined();
    });

    it('should return undefined for an approval when the selected quote is CEX', () => {
        expect(
            selectTxType(getState(getQuote(false)), sendState, getApprovalForm(DEX_SPENDER)),
        ).toBeUndefined();
    });

    it('should return undefined for a plain send with a DEX quote selected', () => {
        expect(selectTxType(getState(getQuote(true)), sendState, sendForm)).toBeUndefined();
    });
});
