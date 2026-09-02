import { type WrappedNativeFlowType } from '@suite-common/wallet-core';
import { type TxKeyPath } from '@suite-native/intl';

type WrappedNativeFlowMessages = {
    complete: Record<'closeButton' | 'subtitle' | 'title', TxKeyPath>;
    form: Record<
        | 'amountLabel'
        | 'deviceNotConnectedError'
        | 'failedSubtitle'
        | 'failedTitle'
        | 'pendingTransactionTitle'
        | 'submitButton'
        | 'title',
        TxKeyPath
    >;
    review: Record<'submitButton' | 'title', TxKeyPath>;
    stepFooter: Record<'skipButton' | 'submitButton', TxKeyPath>;
};

export const wrappedNativeFlowMessages = {
    wrap: {
        complete: {
            closeButton: 'earn.wrapNativeToken.closeButton',
            subtitle: 'earn.wrapNativeToken.complete.subtitle',
            title: 'earn.wrapNativeToken.complete.title',
        },
        form: {
            amountLabel: 'earn.wrapNativeToken.amountToWrap',
            deviceNotConnectedError: 'earn.wrapNativeToken.errors.deviceNotConnected',
            failedSubtitle: 'earn.wrapNativeToken.complete.failedSubtitle',
            failedTitle: 'earn.wrapNativeToken.complete.failedTitle',
            pendingTransactionTitle: 'earn.wrapNativeToken.pendingTransactionTitle',
            submitButton: 'earn.wrapNativeToken.submitButton',
            title: 'earn.wrapNativeToken.title',
        },
        review: {
            submitButton: 'earn.wrapNativeToken.review.submitButton',
            title: 'earn.wrapNativeToken.review.title',
        },
        stepFooter: {
            skipButton: 'earn.yieldDepositFlowScreen.wrapSkipButton',
            submitButton: 'earn.yieldDepositFlowScreen.wrapSubmitButton',
        },
    },
    unwrap: {
        complete: {
            closeButton: 'earn.unwrapNativeToken.closeButton',
            subtitle: 'earn.unwrapNativeToken.complete.subtitle',
            title: 'earn.unwrapNativeToken.complete.title',
        },
        form: {
            amountLabel: 'earn.unwrapNativeToken.amountToUnwrap',
            deviceNotConnectedError: 'earn.unwrapNativeToken.errors.deviceNotConnected',
            failedSubtitle: 'earn.unwrapNativeToken.complete.failedSubtitle',
            failedTitle: 'earn.unwrapNativeToken.complete.failedTitle',
            pendingTransactionTitle: 'earn.unwrapNativeToken.pendingTransactionTitle',
            submitButton: 'earn.unwrapNativeToken.submitButton',
            title: 'earn.unwrapNativeToken.title',
        },
        review: {
            submitButton: 'earn.unwrapNativeToken.review.submitButton',
            title: 'earn.unwrapNativeToken.review.title',
        },
        stepFooter: {
            skipButton: 'earn.yieldWithdrawFlowScreen.unwrapSkipButton',
            submitButton: 'earn.yieldWithdrawFlowScreen.unwrapSubmitButton',
        },
    },
} as const satisfies Record<WrappedNativeFlowType, WrappedNativeFlowMessages>;
