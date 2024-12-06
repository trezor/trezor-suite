import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { selectNetworkTokenDefinitions } from './tokenDefinitionsSelectors';
import { getTokenDefinitionThunk } from './tokenDefinitionsThunks';
import { getSupportedDefinitionTypes } from './tokenDefinitionsUtils';

const CHANGE_NETWORKS = '@wallet-settings/change-networks'; // from walletSettings.ts

export const prepareTokenDefinitionsMiddleware = createMiddlewareWithExtraDeps(
    (action, { dispatch, next, getState }) => {
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
    },
);
