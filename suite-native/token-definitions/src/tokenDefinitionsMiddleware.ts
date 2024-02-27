import { isAnyOf } from '@reduxjs/toolkit';

import { createMiddleware } from '@suite-common/redux-utils';
import { getNetworkFeatures, isEthereumBasedNetwork, networks } from '@suite-common/wallet-config';
import {
    accountsActions,
    getTokenDefinitionThunk,
    selectShouldFetchTokenDefinition,
} from '@suite-common/wallet-core';

const isAccountChangingAction = isAnyOf(
    accountsActions.createAccount,
    accountsActions.updateAccount,
);

export const tokenDefinitionsMiddleware = createMiddleware(
    (action, { dispatch, next, getState }) => {
        // The action changes has to be stored before evaluated in this middleware,
        // because it needs to check the latest state to decide if we should fetch token definitions.
        next(action);

        if (isAccountChangingAction(action)) {
            const { symbol } = action.payload;

            const networkFeatures = getNetworkFeatures(symbol);

            if (networkFeatures.includes('token-definitions')) {
                action.payload.tokens?.forEach(token => {
                    const contractAddress = token.contract;

                    const shouldFetchTokenDefinition = selectShouldFetchTokenDefinition(
                        getState(),
                        symbol,
                        contractAddress,
                    );

                    const network = networks[symbol];
                    if (shouldFetchTokenDefinition && isEthereumBasedNetwork(network)) {
                        dispatch(
                            getTokenDefinitionThunk({
                                networkSymbol: symbol,
                                chainId: network.chainId,
                                contractAddress,
                            }),
                        );
                    }
                });
            }
        }

        // Fetch token definitions for each token of the suite-native discovery created account.
        if (accountsActions.createIndexLabeledAccount.match(action)) {
            const { tokens, symbol } = action.payload;

            const network = networks[symbol];
            if (isEthereumBasedNetwork(network)) {
                const { chainId } = network;
                tokens?.forEach(token => {
                    const shouldFetchTokenDefinition = selectShouldFetchTokenDefinition(
                        getState(),
                        symbol,
                        token.contract,
                    );

                    if (shouldFetchTokenDefinition)
                        dispatch(
                            getTokenDefinitionThunk({
                                networkSymbol: symbol,
                                contractAddress: token.contract,
                                chainId,
                            }),
                        );
                });
            }
        }

        return action;
    },
);
