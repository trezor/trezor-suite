import { type UnknownAction } from '@reduxjs/toolkit';

import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { type Account } from '@suite-common/wallet-types';
import { getAccountAddresses } from '@suite-common/wallet-utils';

import { subscribeBlockchainThunk, unsubscribeBlockchainThunk } from './blockchainThunks';
import { accountsActions } from '../accounts/accountsActions';
import { type AccountsRootState } from '../accounts/accountsReducer';
import { selectAccountByKey } from '../accounts/accountsSelectors';

// Networks without an address list are subscribed by descriptor.
const getSubscribedAddresses = (account: Account) =>
    account.addresses
        ? getAccountAddresses(account).map(({ address }) => address)
        : [account.descriptor];

const hasSubscriptionChanged = (previous: Account | null | undefined, next: Account) => {
    if (!previous || previous.failed !== next.failed) return true;

    const previousAddresses = getSubscribedAddresses(previous);
    const nextAddresses = getSubscribedAddresses(next);

    return (
        previousAddresses.length !== nextAddresses.length ||
        previousAddresses.some((address, index) => address !== nextAddresses[index])
    );
};

type BlockchainSubscriptionMiddlewareState = AccountsRootState;

// A backend connects on first use, which during discovery is before its accounts exist, so the
// accounts (and the network's blocks) are subscribed as they enter the store.
export const prepareBlockchainSubscriptionMiddleware = createMiddlewareWithExtraDeps<
    void,
    UnknownAction,
    BlockchainSubscriptionMiddlewareState
>((action, { dispatch, next, getState }) => {
    const previousAccount = accountsActions.updateAccount.match(action)
        ? selectAccountByKey(getState(), action.payload.account.key)
        : undefined;

    next(action);

    if (
        accountsActions.createAccount.match(action) ||
        (accountsActions.updateAccount.match(action) &&
            hasSubscriptionChanged(previousAccount, action.payload.account))
    ) {
        dispatch(subscribeBlockchainThunk({ symbol: action.payload.account.symbol }));
    }

    if (accountsActions.removeAccount.match(action)) {
        dispatch(unsubscribeBlockchainThunk(action.payload));
    }

    return action;
});
