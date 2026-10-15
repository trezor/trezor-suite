import { type Dispatch, type UnknownAction } from '@reduxjs/toolkit';

import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type SignPreparedEthereumStakingTransactionRejectValue,
    type SignPreparedSolanaStakingTransactionRejectValue,
} from '@suite-common/wallet-core';
import { type Account, type BaseStakeType, type StakeType } from '@suite-common/wallet-types';
import { type WithServices } from '@trezor/redux-utils';

export type StakeSignThunkDeps = WithServices<DesktopAnalyticsDep>;

export type StakeSignResult = string | { reason: 'timeout' } | undefined;

export const isBaseStakeType = (stakeType: StakeType): stakeType is BaseStakeType =>
    stakeType === 'stake' || stakeType === 'unstake' || stakeType === 'claim';

export const reportStakeSignFailure = (
    dispatch: Dispatch<UnknownAction>,
    message: string | undefined,
): StakeSignResult => {
    dispatch(
        notificationsActions.addToast({
            type: 'sign-tx-error',
            error: message ?? 'Unknown stake action',
        }),
    );

    return undefined;
};

type HandleStakeSignRejectionParams = {
    dispatch: Dispatch<UnknownAction>;
    extra: StakeSignThunkDeps;
    account: Account;
    error:
        | SignPreparedEthereumStakingTransactionRejectValue
        | SignPreparedSolanaStakingTransactionRejectValue
        | undefined;
};

export const handleStakeSignRejection = ({
    dispatch,
    extra,
    account,
    error,
}: HandleStakeSignRejectionParams): StakeSignResult => {
    if (error?.error === 'stake-live-state-invalid') {
        return reportStakeSignFailure(dispatch, error.message);
    }

    extra.services.analytics.report({
        type: events.transactionCancelEvent.name,
        payload: {
            txType: 'stake',
            networkSymbol: account.symbol,
        },
    });

    if (error?.error === 'sign-transaction-timeout') {
        return { reason: 'timeout' };
    }

    // catch manual error from TransactionReviewModal
    if (error?.message === 'tx-cancelled') return undefined;

    return reportStakeSignFailure(dispatch, error?.message);
};
