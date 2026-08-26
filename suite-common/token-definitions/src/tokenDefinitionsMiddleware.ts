import { type ActionCreatorWithPreparedPayload, type UnknownAction } from '@reduxjs/toolkit';

import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { selectNetworkTokenDefinitions } from './tokenDefinitionsSelectors';
import { getTokenDefinitionThunk } from './tokenDefinitionsThunks';
import { type TokenDefinitionsRootState } from './tokenDefinitionsTypes';
import { getSupportedDefinitionTypes } from './tokenDefinitionsUtils';

type TokenDefinitionsMiddlewareState = TokenDefinitionsRootState;

export type TokenDefinitionsMiddlewareDeps = {
    actions: {
        changeNetworks: ActionCreatorWithPreparedPayload<
            [payload: NetworkSymbol[]],
            NetworkSymbol[]
        >;
    };
};

export const prepareTokenDefinitionsMiddleware = createMiddlewareWithExtraDeps<
    TokenDefinitionsMiddlewareDeps,
    UnknownAction,
    TokenDefinitionsMiddlewareState
>((action, { dispatch, next, getState, extra }) => {
    next(action);

    if (extra.actions.changeNetworks.match(action)) {
        action.payload.forEach(symbol => {
            const tokenDefinitions = selectNetworkTokenDefinitions(getState(), symbol);

            if (!tokenDefinitions) {
                const definitionTypes = getSupportedDefinitionTypes(symbol);

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
