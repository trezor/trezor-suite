import { type Account } from '@suite-common/wallet-types';
import { type Result, err, ok } from '@trezor/type-utils';

import { getNamespaces } from './adapters';
import { type WalletConnectNamespace } from './walletConnectTypes';

export const ethereumAccountRequiredError = {
    type: 'ethereum-account-required',
    message: 'An Ethereum account is required for WalletConnect authentication.',
} as const;

type SessionAuthenticateContext = {
    account: Account;
    namespace: WalletConnectNamespace;
};

type SessionAuthenticateContextError = typeof ethereumAccountRequiredError;

export const getSessionAuthenticateContext = (
    accounts: Account[],
): Result<SessionAuthenticateContext, SessionAuthenticateContextError> => {
    const namespace = getNamespaces(accounts).eip155;
    const ethereumAccount = accounts.find(account => account.symbol === 'eth' && account.visible);

    if (!namespace || !ethereumAccount) {
        return err(ethereumAccountRequiredError);
    }

    return ok({ account: ethereumAccount, namespace });
};
