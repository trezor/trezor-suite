import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { selectNetworkTokenDefinitions } from '../../../../../suite-common/token-definitions/src/tokenDefinitionsSelectors';
import { getTokenDefinitionThunk } from '../../../../../suite-common/token-definitions/src/tokenDefinitionsThunks';
import { getSupportedDefinitionTypes } from '../../../../../suite-common/token-definitions/src/tokenDefinitionsUtils';

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
