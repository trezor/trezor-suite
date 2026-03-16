import { D } from '@mobily/ts-belt';

import { createThunk } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TimerId } from '@trezor/type-utils';

import { selectNetworkTokenDefinitions } from './tokenDefinitionsSelectors';
import { type DefinitionType, TokenStructureType } from './tokenDefinitionsTypes';
import { fetchTokenDefinitions, getSupportedDefinitionTypes } from './tokenDefinitionsUtils';

const TOKEN_DEFINITIONS_MODULE = '@common/wallet-core/token-definitions';

export const getTokenDefinitionThunk = createThunk(
    `${TOKEN_DEFINITIONS_MODULE}/getNftTokenDefinition`,
    async (
        params: {
            symbol: NetworkSymbol;
            type: DefinitionType;
        },
        { fulfillWithValue, rejectWithValue },
    ) => {
        try {
            const data = await fetchTokenDefinitions(
                params.symbol,
                params.type,
                TokenStructureType.SIMPLE,
            );

            return fulfillWithValue(data);
        } catch (error) {
            return rejectWithValue(error.toString());
        }
    },
);

export const initTokenDefinitionsThunk = createThunk(
    `${TOKEN_DEFINITIONS_MODULE}/initTokenDefinitionsThunk`,
    (_, { getState, dispatch, extra }) => {
        const enabledNetworks = extra.selectors.selectTokenDefinitionsEnabledNetworks(getState());

        const promises = enabledNetworks
            .map(symbol => {
                let definitionTypes = getSupportedDefinitionTypes(symbol);

                const tokenDefinitions = selectNetworkTokenDefinitions(getState(), symbol);

                if (tokenDefinitions) {
                    // Filter out definition types that have data or are in a loading state
                    definitionTypes = definitionTypes.filter(type => {
                        const definition = tokenDefinitions[type];

                        return !(definition && (definition.data || definition.isLoading));
                    });
                }

                if (D.isEmpty(definitionTypes)) return [];

                return definitionTypes.map(type =>
                    dispatch(
                        getTokenDefinitionThunk({
                            symbol,
                            type,
                        }),
                    ),
                );
            })
            .flat();

        return Promise.all(promises);
    },
);

let tokenDefinitionsTimeout: TimerId | null = null;

export const periodicCheckTokenDefinitionsThunk = createThunk(
    `${TOKEN_DEFINITIONS_MODULE}/periodicCheckTokenDefinitionsThunk`,
    (_, { dispatch }) => {
        if (tokenDefinitionsTimeout) {
            clearTimeout(tokenDefinitionsTimeout);
        }

        tokenDefinitionsTimeout = setTimeout(() => {
            dispatch(periodicCheckTokenDefinitionsThunk());
        }, 60_000);

        return dispatch(initTokenDefinitionsThunk());
    },
);
