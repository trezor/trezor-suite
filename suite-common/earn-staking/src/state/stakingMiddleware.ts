import type { UnknownAction } from '@reduxjs/toolkit';

import type { QueryClientDep } from '@suite-common/react-query';
import { accountsActions, changeNetworks } from '@suite-common/wallet-core';
import type { Account } from '@suite-common/wallet-types';
import { type WithServices, createMiddlewareWithExtraDeps } from '@trezor/redux-utils';

import type { StakingDep } from '../stakingServices';
import { stakingActions } from './stakingReducer';
import {
    refreshStakingProductInfoThunk,
    syncAllStakingPositionsThunk,
    syncStakingPositionsThunk,
} from './stakingThunks';

export type StakingMiddlewareDeps = WithServices<StakingDep & QueryClientDep>;

type StakingMiddlewareState = void;

export const prepareStakingMiddleware = createMiddlewareWithExtraDeps<
    StakingMiddlewareDeps,
    UnknownAction,
    StakingMiddlewareState
>((action, { dispatch, next, extra }) => {
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

    return action;
});
