import { type PayloadActionCreator, type UnknownAction } from '@reduxjs/toolkit';

import { type NetworksRootState, selectNetworkConfigAccessors } from '@suite-common/networks';
import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { selectNetworkTokenDefinitions } from './tokenDefinitionsSelectors';
import { getTokenDefinitionThunk } from './tokenDefinitionsThunks';
import { type TokenDefinitionsRootState } from './tokenDefinitionsTypes';
import { getSupportedDefinitionTypes } from './tokenDefinitionsUtils';

type TokenDefinitionsMiddlewareState = TokenDefinitionsRootState & NetworksRootState;

export type TokenDefinitionsMiddlewareDeps = {
    actions: {
        changeNetworks: Pick<PayloadActionCreator<{ enabledNetworks: NetworkSymbol[] }>, 'match'>;
    };
};

export const prepareTokenDefinitionsMiddleware = createMiddlewareWithExtraDeps<
    TokenDefinitionsMiddlewareDeps,
    UnknownAction,
    TokenDefinitionsMiddlewareState
>((action, { dispatch, next, getState, extra }) => {
    const networkConfigDeps = selectNetworkConfigAccessors(getState());

    next(action);

    if (extra.actions.changeNetworks.match(action)) {
        action.payload.enabledNetworks.forEach(symbol => {
            const tokenDefinitions = selectNetworkTokenDefinitions(getState(), symbol);

            if (!tokenDefinitions) {
                const definitionTypes = getSupportedDefinitionTypes(networkConfigDeps, symbol);

                definitionTypes.forEach(type => {
                    dispatch(
                        getTokenDefinitionThunk({
                            symbol,
                            type,
                        }),
                    );
                });
            }
        });
    }

    return action;
});
