import { type FormState } from '@suite-common/wallet-types';

import { USER_CANCELLED_ERROR_CODES } from './constants';

export const buildEarnComposeFormState = (
    contractAddress: string,
    amount: string,
    calldata: string,
): FormState => ({
    outputs: [
        {
            address: contractAddress,
            amount,
            type: 'payment',
            token: null,
            fiat: '',
            currency: { label: '', value: '' },
        },
    ],
    options: ['transactionData'],
    transactionData: calldata,
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
    selectedFee: 'normal',
    feePerUnit: '',
    feeLimit: '',
});

export const isUserCancelledSignError = (
    payload: { errorCode?: string; message?: string } | undefined,
) =>
    payload?.message === 'tx-cancelled' ||
    (!!payload?.errorCode && USER_CANCELLED_ERROR_CODES.some(code => code === payload.errorCode));

export type EarnReviewErrorPayload =
    { error?: string; errorCode?: string; message?: string } | undefined;

export type EarnReviewErrorReaction =
    'none' | 'popScreen' | 'pendingConflict' | 'pushFailed' | 'signFailed' | 'deviceDisconnected';

export const getEarnReviewErrorReaction = (
    payload: EarnReviewErrorPayload,
): EarnReviewErrorReaction => {
    if (payload?.error === 'sign-transaction-timeout') {
        return 'none';
    }

    if (payload?.message === 'tx-cancelled') {
        return 'none';
    }

    if (payload?.error === 'push-transaction-pending-conflict') {
        return 'pendingConflict';
    }

    if (payload?.error === 'push-transaction-failed') {
        return 'pushFailed';
    }

    if (payload?.error === 'stake-live-state-invalid') {
        return 'signFailed';
    }

    const errorCode = payload?.errorCode;

    if (USER_CANCELLED_ERROR_CODES.some(code => code === errorCode)) {
        return 'popScreen';
    }

    return 'deviceDisconnected';
};
