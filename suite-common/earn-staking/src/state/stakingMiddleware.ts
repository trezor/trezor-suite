import type { UnknownAction } from '@reduxjs/toolkit';

import type { QueryClientDep } from '@suite-common/react-query';
import {
    accountsActions,
    changeNetworks,
    handleEarnTransactionReplacementThunk,
    transactionsActions,
} from '@suite-common/wallet-core';
import type { Account, AccountKey } from '@suite-common/wallet-types';
import { type WithServices, createMiddlewareWithExtraDeps } from '@trezor/redux-utils';

import {
    getAwaitingStakingSteps,
    getStakingStepSettlementAction,
    settleStakingSteps,
} from '../engine/stakingConfirmation';
import type { StakingDep } from '../stakingServices';
import { type StakingRootState, stakingActions } from './stakingReducer';
import { selectStakingSessionsByAccount } from './stakingSessionSelectors';
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

    const getAwaitingSteps = (accountKey: AccountKey, txid: string) =>
        getAwaitingStakingSteps(selectStakingSessionsByAccount(getState(), accountKey)).filter(
            step => step.txid === txid,
        );

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
            getAwaitingSteps(account.key, precomposedTransaction.prevTxid).forEach(step =>
                dispatch(
                    precomposedTransaction.rbfType === 'bump-fee'
                        ? stakingActions.stepTxidReplaced({ ...step, txid })
                        : stakingActions.stepFailed({
                              ...step,
                              error: { kind: 'replaced', code: null },
                          }),
                ),
            );
        }
    }

    if (transactionsActions.replaceTransaction.match(action)) {
        const { key, txid, tx } = action.payload;

        getAwaitingSteps(key, txid).forEach(step =>
            dispatch(stakingActions.stepTxidReplaced({ ...step, txid: tx.txid })),
        );
    }

    return action;
});
