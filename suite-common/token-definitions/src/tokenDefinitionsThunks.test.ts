import { configureStore } from '@reduxjs/toolkit';

import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { asGetter } from '@trezor/dependency-injection';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import { getRankedTokenDefinitionsUrl } from './fetchRankedTokenDefinitions';
import { prepareTokenDefinitionsReducer } from './tokenDefinitionsReducer';
import {
    type RefreshTokenDefinitionsThunkDeps,
    refreshTokenDefinitionsThunk,
} from './tokenDefinitionsThunks';
import {
    DefinitionType,
    type TokenDefinition,
    type TokenDefinitionsState,
    TokenStructureType,
} from './tokenDefinitionsTypes';
import { getTokenDefinitionsUrl } from './tokenDefinitionsUtils';

const eth = asNetworkSymbol('eth');
const base = asNetworkSymbol('base');
const ethCoinUrl = getTokenDefinitionsUrl(eth, DefinitionType.COIN, TokenStructureType.SIMPLE);
const previousCopy = ['0xprevious'];
const currentCopy = ['0xcurrent'];

const loaded = (data = previousCopy): TokenDefinition => ({
    error: false,
    data,
    isLoading: false,
    hide: ['0xhidden'],
    show: ['0xshown'],
});

type InitStoreParams = {
    tokenDefinitions: TokenDefinitionsState;
    enabledNetworks?: NetworkSymbol[];
};

const initStore = ({ tokenDefinitions, enabledNetworks = [eth, base] }: InitStoreParams) => {
    const extra: RefreshTokenDefinitionsThunkDeps = {
        services: { getTokenDefinitionsEnabledNetworks: asGetter(() => enabledNetworks) },
    };

    return configureStore({
        reducer: {
            tokenDefinitions: prepareTokenDefinitionsReducer({
                actionTypes: { storageLoad: mockActionType('storageLoad') },
                reducers: { storageLoadTokenManagement: mockReducer() },
            }),
        },
        preloadedState: { tokenDefinitions },
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({
                thunk: { extraArgument: extra },
            }),
    });
};

const mockFetch = (response: Promise<Response>) =>
    jest.spyOn(globalThis, 'fetch').mockImplementation(() => response);

describe(refreshTokenDefinitionsThunk.name, () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('loads again the definitions published at the URL and keeps the rest', async () => {
        const fetch = mockFetch(Promise.resolve(Response.json(currentCopy)));
        const store = initStore({
            tokenDefinitions: {
                [eth]: { coin: loaded(), nft: loaded() },
                [base]: { coin: loaded() },
            },
        });

        await store.dispatch(refreshTokenDefinitionsThunk({ url: ethCoinUrl! }));

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(ethCoinUrl);
        expect(store.getState().tokenDefinitions).toEqual({
            [eth]: { coin: loaded(currentCopy), nft: loaded() },
            [base]: { coin: loaded() },
        });
    });

    it.each([
        ['another file', getRankedTokenDefinitionsUrl(), [eth, base]],
        ['a network that is not enabled', ethCoinUrl!, [base]],
    ])('loads nothing for %s', async (_, url, enabledNetworks) => {
        const fetch = mockFetch(Promise.resolve(Response.json(currentCopy)));
        const tokenDefinitions = { [eth]: { coin: loaded() }, [base]: { coin: loaded() } };
        const store = initStore({ tokenDefinitions, enabledNetworks });

        await store.dispatch(refreshTokenDefinitionsThunk({ url }));

        expect(fetch).not.toHaveBeenCalled();
        expect(store.getState().tokenDefinitions).toEqual(tokenDefinitions);
    });

    it('leaves definitions that are not loaded to their own load', async () => {
        const fetch = mockFetch(Promise.resolve(Response.json(currentCopy)));
        const loading: TokenDefinition = { ...loaded(), data: undefined, isLoading: true };
        const store = initStore({ tokenDefinitions: { [eth]: { coin: loading } } });

        await store.dispatch(refreshTokenDefinitionsThunk({ url: ethCoinUrl! }));

        expect(fetch).not.toHaveBeenCalled();
        expect(store.getState().tokenDefinitions[eth]?.coin).toEqual(loading);
    });

    it.each([
        ['the request fails', Promise.reject(new TypeError('Failed to fetch'))],
        ['the server answers an error', Promise.resolve(new Response(null, { status: 503 }))],
    ])('keeps the loaded definitions when %s', async (_, response) => {
        mockFetch(response);
        const store = initStore({ tokenDefinitions: { [eth]: { coin: loaded() } } });

        await store.dispatch(refreshTokenDefinitionsThunk({ url: ethCoinUrl! }));

        expect(store.getState().tokenDefinitions[eth]?.coin).toEqual(loaded());
    });
});
