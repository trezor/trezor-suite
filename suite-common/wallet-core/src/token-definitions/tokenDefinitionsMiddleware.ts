import { Account, Timestamp, TokenAddress } from 'suite-common/wallet-types/src';
import { isAnyOf } from '@reduxjs/toolkit';

import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import {
    NetworkSymbol,
    getNetworkFeatures,
    isEthereumBasedNetwork,
    networks,
} from '@suite-common/wallet-config';

import { accountsActions } from '../accounts/accountsActions';
import { getTokenDefinitionThunk } from './tokenDefinitionsThunks';
import { selectSpecificTokenDefinition } from './tokenDefinitionsSelectors';
import { updateFiatRatesThunk } from '../fiat-rates/fiatRatesThunks';

export const prepareTokenDefinitionsMiddleware = createMiddlewareWithExtraDeps(
    (action, { dispatch, extra, next, getState }) => {
        const {
            selectors: { selectLocalCurrency },
        } = extra;

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

        if (getTokenDefinitionThunk.fulfilled.match(action)) {
            dispatch(
                updateFiatRatesThunk({
                    ticker: {
                        symbol: action.meta.arg.networkSymbol as NetworkSymbol,
                        tokenAddress: action.meta.arg.contractAddress as TokenAddress,
                    },
                    localCurrency: selectLocalCurrency(getState()),
                    rateType: 'current',
                    lastSuccessfulFetchTimestamp: Date.now() as Timestamp,
                }),
            );
        }

        return action;
    },
);
