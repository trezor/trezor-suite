import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { getNetworkFeatures, isEthereumBasedNetwork, networks } from '@suite-common/wallet-config';

import { accountsActions } from '../accounts/accountsActions';
import { getTokenDefinitionThunk } from './tokenDefinitionsThunks';
import { selectSpecificTokenDefinition } from './tokenDefinitionsSelectors';

export const prepareTokenDefinitionsMiddleware = createMiddlewareWithExtraDeps(
    (action, { dispatch, next, getState }) => {
        next(action);

        if (
            accountsActions.createAccount.match(action) ||
            accountsActions.updateAccount.match(action)
        ) {
            const { symbol } = action.payload;

            const networkFeatures = getNetworkFeatures(symbol);

            if (networkFeatures.includes('token-definitions')) {
                action.payload.tokens?.forEach(token => {
                    const contractAddress = token.contract;

                    const tokenDefinition = selectSpecificTokenDefinition(
                        getState(),
                        symbol,
                        contractAddress,
                    );

                    const network = networks[symbol];
                    if (
                        isEthereumBasedNetwork(network) &&
                        (!tokenDefinition || tokenDefinition.error)
                    ) {
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

        return action;
    },
);
