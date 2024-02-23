import { Account, Timestamp, TokenAddress } from 'suite-common/wallet-types/src';
import { isAnyOf } from '@reduxjs/toolkit';

import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { getNetworkFeatures, isEthereumBasedNetwork, networks } from '@suite-common/wallet-config';

import { accountsActions } from '../accounts/accountsActions';
import { getTokenDefinitionThunk } from './tokenDefinitionsThunks';
import { selectSpecificTokenDefinition } from './tokenDefinitionsSelectors';

export const prepareTokenDefinitionsMiddleware = createMiddlewareWithExtraDeps(
    (action, { dispatch, next, getState }) => {
        next(action);

        if (
            isAnyOf(
                accountsActions.createAccount,
                accountsActions.updateAccount,
                accountsActions.updateSelectedAccount,
            )(action)
        ) {
            let account: Account;
            if (isAnyOf(accountsActions.createAccount, accountsActions.updateAccount)(action)) {
                account = action.payload;
            } else if (
                accountsActions.updateSelectedAccount.match(action) &&
                action.payload.status === 'loaded'
            ) {
                account = action.payload.account;
            } else {
                return action;
            }

            const networkFeatures = getNetworkFeatures(account.symbol);

            if (networkFeatures.includes('token-definitions')) {
                account.tokens?.forEach(token => {
                    const contractAddress = token.contract;

                    const tokenDefinition = selectSpecificTokenDefinition(
                        getState(),
                        account.symbol,
                        contractAddress,
                    );

                    const network = networks[account.symbol];
                    if (
                        isEthereumBasedNetwork(network) &&
                        (!tokenDefinition || tokenDefinition.error)
                    ) {
                        dispatch(
                            getTokenDefinitionThunk({
                                networkSymbol: account.symbol,
                                chainId: network.chainId,
                                contractAddress,
                            }),
                        );
                    }
                });
            }
        }

        return action;
    },
);
