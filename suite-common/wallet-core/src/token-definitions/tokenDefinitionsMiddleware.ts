import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';

import { accountsActions } from '../accounts/accountsActions';
import { getTokenDefinitionThunk } from './tokenDefinitionsThunks';
import { selectSpecificTokenDefinition } from './tokenDefinitionsSelectors';

export const prepareTokenDefinitionsMiddleware = createMiddlewareWithExtraDeps(
    (action, { dispatch, next, getState }) => {
        next(action);

        if (accountsActions.updateSelectedAccount.match(action)) {
            const { network } = action.payload;

            if (
                action.payload.status === 'loaded' &&
                network?.features.includes('token-definitions')
            ) {
                action.payload.account.tokens?.forEach(token => {
                    const contractAddress = token.contract;

                    const tokenDefinition = selectSpecificTokenDefinition(
                        getState(),
                        network?.symbol,
                        contractAddress,
                    );

                    if (!tokenDefinition || tokenDefinition.error) {
                        dispatch(getTokenDefinitionThunk({ network, contractAddress }));
                    }
                });
            }
        }
        return action;
    },
);
