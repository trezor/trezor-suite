import { type ExchangeTrade } from 'invity-api';

import {
    type SendState,
    type StakeState,
    type TronStakeTxReviewState,
    type YieldRootState,
    type YieldTxReviewState,
    initialStablecoinYieldState,
} from '@suite-common/wallet-core';
import { type FormState, type PrecomposedTransactionFinal } from '@suite-common/wallet-types';

import {
    type GetReviewSourceParams,
    getReviewSource,
    getTransactionReviewDeadline,
    selectTxType,
} from './utils';

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

const precomposedTx: PrecomposedTransactionFinal = {
    type: 'final',
    fee: '420000',
    feePerByte: '20',
    totalSpent: '420000',
    bytes: 0,
    inputs: [],
    outputs: [],
    outputsPermutation: [],
};

const mockForm = (): FormState => ({
    outputs: [],
    feePerUnit: '20',
    feeLimit: '21000',
    options: ['broadcast'],
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
});

describe('getReviewSource', () => {
    const sendPrecomposedForm = mockForm();
    const stakePrecomposedForm = mockForm();
    const idle: GetReviewSourceParams = {
        tronStakeTxReview: {},
        yieldTxReview: {},
        send: { drafts: {} },
        sendPrecomposedForm,
        stake: {},
        stakePrecomposedForm,
    };

    it('reviews the stake transaction when no other flow has one composed', () => {
        const stake: StakeState = { precomposedTx };
        const selection = getReviewSource({ ...idle, stake });

        expect(selection.source).toBe('stake');
        expect(selection.txInfoState).toBe(stake);
        expect(selection.precomposedForm).toBe(stakePrecomposedForm);
    });

    it('reviews the send transaction ahead of a stake one', () => {
        const send: SendState = { drafts: {}, precomposedTx };
        const selection = getReviewSource({ ...idle, send, stake: { precomposedTx } });

        expect(selection.source).toBe('send');
        expect(selection.txInfoState).toBe(send);
        expect(selection.precomposedForm).toBe(sendPrecomposedForm);
    });

    it('reviews a yield transaction ahead of a send one', () => {
        const yieldTxReview: YieldTxReviewState = { precomposedTx, precomposedForm: mockForm() };
        const selection = getReviewSource({
            ...idle,
            yieldTxReview,
            send: { drafts: {}, precomposedTx },
        });

        expect(selection.source).toBe('yield');
        expect(selection.txInfoState).toBe(yieldTxReview);
        expect(selection.precomposedForm).toBe(yieldTxReview.precomposedForm);
    });

    it('reviews a Tron stake transaction ahead of every other flow', () => {
        const tronStakeTxReview: TronStakeTxReviewState = {
            precomposedTx,
            precomposedForm: mockForm(),
        };
        const selection = getReviewSource({
            ...idle,
            tronStakeTxReview,
            yieldTxReview: { precomposedTx },
            send: { drafts: {}, precomposedTx },
            stake: { precomposedTx },
        });

        expect(selection.source).toBe('tronStake');
        expect(selection.txInfoState).toBe(tronStakeTxReview);
        expect(selection.precomposedForm).toBe(tronStakeTxReview.precomposedForm);
    });
});

describe('selectTxType', () => {
    const state: YieldRootState = { wallet: { stablecoinYield: initialStablecoinYieldState } };

    it('is a stake for the stake and the Tron stake sources', () => {
        expect(selectTxType(state, 'stake', mockForm())).toBe('stake');
        expect(selectTxType(state, 'tronStake', mockForm())).toBe('stake');
    });

    it('is nothing for a plain send', () => {
        expect(selectTxType(state, 'send', mockForm())).toBeUndefined();
    });
});
