import type { UnknownAction } from '@reduxjs/toolkit';

import type { QueryClientDep } from '@suite-common/react-query';
import {
    accountsActions,
    changeNetworks,
    handleEarnTransactionReplacementThunk,
    transactionsActions,
} from '@suite-common/wallet-core';
import type { Account } from '@suite-common/wallet-types';
import { type WithServices, createMiddlewareWithExtraDeps } from '@trezor/redux-utils';

import { getStakingStepSettlementAction, settleStakingSteps } from '../engine/stakingConfirmation';
import type { StakingDep } from '../stakingServices';
import { type StakingRootState, stakingActions } from './stakingReducer';
import {
    selectAwaitingStakingStepsByTxid,
    selectStakingSessionsByAccount,
} from './stakingSessionSelectors';
import {
    refreshStakingProductInfoThunk,
    syncAllStakingPositionsThunk,
    syncStakingPositionsThunk,
} from './stakingThunks';

export type StakingMiddlewareDeps = WithServices<StakingDep & QueryClientDep>;

type StakingMiddlewareState = StakingRootState;

export const prepareStakingMiddleware = createMiddlewareWithExtraDeps<
    StakingMiddlewareDeps,
    UnknownAction,
    StakingMiddlewareState
>((action, { dispatch, getState, next, extra }) => {
    next(action);

    const syncAccount = (account: Account) => {
        if (!extra.services.staking.stakingProductRepository.isSupportedSymbol(account.symbol)) {
            return;
        }

        dispatch(syncStakingPositionsThunk({ accountKey: account.key }));
    };

    if (
        accountsActions.createAccount.match(action) ||
        accountsActions.updateAccount.match(action)
    ) {
        syncAccount(action.payload.account);
    }

    if (accountsActions.createAccountFromAccountInfo.match(action)) {
        syncAccount(action.payload);
    }

    if (changeNetworks.match(action)) {
        dispatch(refreshStakingProductInfoThunk());
    }

    if (stakingActions.productsRegistered.match(action)) {
        dispatch(syncAllStakingPositionsThunk());
    }

    if (transactionsActions.addTransaction.match(action)) {
        const { account, transactions } = action.payload;

        const settlements = settleStakingSteps({
            sessions: selectStakingSessionsByAccount(getState(), account.key),
            transactions,
        });

        settlements.forEach(settlement => dispatch(getStakingStepSettlementAction(settlement)));

        if (settlements.length > 0) {
            dispatch(syncStakingPositionsThunk({ accountKey: account.key }));
        }
    }

    if (handleEarnTransactionReplacementThunk.pending.match(action)) {
        const { account, precomposedTransaction, txid } = action.meta.arg;

        if (txid !== null) {
            const awaitingSteps = selectAwaitingStakingStepsByTxid(
                getState(),
                account.key,
                precomposedTransaction.prevTxid,
            );

            awaitingSteps.forEach(step =>
                dispatch(
                    stakingActions.stepReplacementBroadcast({
                        sessionKey: step.sessionKey,
                        stepId: step.stepId,
                        txid,
                        isCancellation: precomposedTransaction.rbfType === 'cancel',
                    }),
                ),
            );
        }
    }

    if (transactionsActions.replaceTransaction.match(action)) {
        const { key, txid, tx } = action.payload;

        const awaitingSteps = selectAwaitingStakingStepsByTxid(getState(), key, txid);

        awaitingSteps.forEach(step =>
            dispatch(
                stakingActions.stepReplacementBroadcast({
                    sessionKey: step.sessionKey,
                    stepId: step.stepId,
                    txid: tx.txid,
                    isCancellation: false,
                }),
            ),
        );
    }

    return action;
});
