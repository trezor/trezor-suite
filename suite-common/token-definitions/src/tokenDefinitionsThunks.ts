import { D } from '@mobily/ts-belt';

import { type WithServices, createThunk } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TimerId } from '@trezor/type-utils';

import { selectNetworkTokenDefinitions } from './tokenDefinitionsSelectors';
import {
    type DefinitionType,
    type GetTokenDefinitionsEnabledNetworksDep,
    type TokenDefinitionsRootState,
    TokenStructureType,
} from './tokenDefinitionsTypes';
import {
    fetchTokenDefinitions,
    getSupportedDefinitionTypes,
    sanitizeTokenDefinitions,
} from './tokenDefinitionsUtils';

const TOKEN_DEFINITIONS_MODULE = '@common/wallet-core/token-definitions';

export const getTokenDefinitionThunk = createThunk<
    string[],
    {
        symbol: NetworkSymbol;
        type: DefinitionType;
    },
    void
>(
    `${TOKEN_DEFINITIONS_MODULE}/getTokenDefinitionsThunk`,
    async (params, { fulfillWithValue, rejectWithValue }) => {
        try {
            const data = await fetchTokenDefinitions(
                params.symbol,
                params.type,
                TokenStructureType.SIMPLE,
            );

            // `data` comes verbatim from the unsigned token-definitions CDN; coerce it to a
            // genuine `string[]` so a poison (non-array / non-string-element) response cannot
            // crash raw consumers such as `useInactiveStellarTokens` (`contract.split('-')`).
            return fulfillWithValue(sanitizeTokenDefinitions(data));
        } catch (error) {
            return rejectWithValue(error.toString());
        }
    },
);

export type InitTokenDefinitionsThunkState = TokenDefinitionsRootState;

export type InitTokenDefinitionsThunkDeps = WithServices<GetTokenDefinitionsEnabledNetworksDep>;

export const initTokenDefinitionsThunk = createThunk<
    unknown[],
    void,
    { state: InitTokenDefinitionsThunkState; extra: InitTokenDefinitionsThunkDeps }
>(`${TOKEN_DEFINITIONS_MODULE}/initTokenDefinitionsThunk`, (_, { getState, dispatch, extra }) => {
    const enabledNetworks = extra.services.getTokenDefinitionsEnabledNetworks();

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
});

let tokenDefinitionsTimeout: TimerId | null = null;

type PeriodicCheckTokenDefinitionsThunkState = InitTokenDefinitionsThunkState;

type PeriodicCheckTokenDefinitionsThunkDeps = InitTokenDefinitionsThunkDeps;

export const periodicCheckTokenDefinitionsThunk = createThunk<
    void,
    void,
    {
        state: PeriodicCheckTokenDefinitionsThunkState;
        extra: PeriodicCheckTokenDefinitionsThunkDeps;
    }
>(`${TOKEN_DEFINITIONS_MODULE}/periodicCheckTokenDefinitionsThunk`, async (_, { dispatch }) => {
    if (tokenDefinitionsTimeout) {
        clearTimeout(tokenDefinitionsTimeout);
    }

    tokenDefinitionsTimeout = setTimeout(() => {
        dispatch(periodicCheckTokenDefinitionsThunk());
    }, 60_000);

    await dispatch(initTokenDefinitionsThunk());
});
