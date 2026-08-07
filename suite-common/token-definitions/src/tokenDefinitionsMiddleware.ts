import { type AnyAction, createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { selectNetworkTokenDefinitions } from './tokenDefinitionsSelectors';
import { getTokenDefinitionThunk } from './tokenDefinitionsThunks';
import { type TokenDefinitionsRootState } from './tokenDefinitionsTypes';
import { getSupportedDefinitionTypes } from './tokenDefinitionsUtils';

const CHANGE_NETWORKS = '@wallet-settings/change-networks'; // from walletSettings.ts

type TokenDefinitionsMiddlewareState = TokenDefinitionsRootState;

export const prepareTokenDefinitionsMiddleware = createMiddlewareWithExtraDeps<
    void,
    AnyAction,
    TokenDefinitionsMiddlewareState
>((action, { dispatch, next, getState }) => {
    next(action);

    if (action.type === CHANGE_NETWORKS) {
        action.payload.forEach((symbol: NetworkSymbol) => {
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
