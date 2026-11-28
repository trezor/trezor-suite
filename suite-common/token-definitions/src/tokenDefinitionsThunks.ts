import { D } from '@mobily/ts-belt';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type WithServices, createThunk } from '@trezor/redux-utils';
import { type TimerId } from '@trezor/type-utils';

import { tokenDefinitionsActions } from './tokenDefinitionsActions';
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
    getTokenDefinitionsUrl,
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
            const data: string[] = await fetchTokenDefinitions(
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

export type RefreshTokenDefinitionsThunkState = TokenDefinitionsRootState;

export type RefreshTokenDefinitionsThunkDeps = WithServices<GetTokenDefinitionsEnabledNetworksDep>;

export type RefreshTokenDefinitionsThunkParams = {
    /** The definitions file a newer copy of which has arrived. */
    url: string;
};

/**
 * Loads the definitions of every enabled network published at `url` again, for a newer copy
 * that arrives during the session: a service worker serves the copy of the previous visit
 * and stores the current one a while later. Only definitions already loaded are loaded again,
 * the others get the newer copy when they load. A failed load keeps the definitions loaded before.
 */
export const refreshTokenDefinitionsThunk = createThunk<
    void,
    RefreshTokenDefinitionsThunkParams,
    { state: RefreshTokenDefinitionsThunkState; extra: RefreshTokenDefinitionsThunkDeps }
>(
    `${TOKEN_DEFINITIONS_MODULE}/refreshTokenDefinitionsThunk`,
    async ({ url }, { getState, dispatch, extra }) => {
        const refreshes = extra.services.getTokenDefinitionsEnabledNetworks().flatMap(symbol =>
            getSupportedDefinitionTypes(symbol)
                .filter(
                    type =>
                        selectNetworkTokenDefinitions(getState(), symbol)?.[type]?.data &&
                        getTokenDefinitionsUrl(symbol, type, TokenStructureType.SIMPLE) === url,
                )
                .map(async type => {
                    try {
                        const data: string[] = await fetchTokenDefinitions(
                            symbol,
                            type,
                            TokenStructureType.SIMPLE,
                        );
                        dispatch(tokenDefinitionsActions.setDefinitions({ symbol, type, data }));
                    } catch {
                        // The definitions loaded before stay until the next visit.
                    }
                }),
        );

        await Promise.all(refreshes);
    },
);
