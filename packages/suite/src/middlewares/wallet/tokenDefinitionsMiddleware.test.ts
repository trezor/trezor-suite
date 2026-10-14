import { createAction } from '@reduxjs/toolkit';

import {
    DefinitionType,
    type TokenDefinitionsRootState,
    getTokenDefinitionThunk,
} from '@suite-common/token-definitions';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';

import {
    type TokenDefinitionsMiddlewareDeps,
    prepareTokenDefinitionsMiddleware,
} from './tokenDefinitionsMiddleware';

jest.mock('@suite-common/token-definitions', () => ({
    ...jest.requireActual('@suite-common/token-definitions'),
    getTokenDefinitionThunk: jest.fn(),
}));

const changeNetworks = createAction<{ enabledNetworks: NetworkSymbol[] }>('test/changeNetworks');
const eth = asNetworkSymbol('eth');
const btc = asNetworkSymbol('btc');

const initMiddleware = (state: TokenDefinitionsRootState = { tokenDefinitions: {} }) => {
    const extra: TokenDefinitionsMiddlewareDeps = { actions: { changeNetworks } };
    const dispatch = jest.fn();
    const next = jest.fn();
    const getState = jest.fn(() => state);
    const middleware = prepareTokenDefinitionsMiddleware(() => extra)({ dispatch, getState })(next);

    return { middleware, dispatch, next, getState };
};

describe('tokenDefinitionsMiddleware', () => {
    const mockThunk = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(getTokenDefinitionThunk).mockReturnValue(mockThunk);
    });

    it('fetches each supported definition for a newly enabled network', () => {
        const { middleware, dispatch, next } = initMiddleware();
        const action = changeNetworks({ enabledNetworks: [eth] });

        expect(middleware(action)).toBe(action);

        expect(next).toHaveBeenCalledWith(action);
        expect(getTokenDefinitionThunk).toHaveBeenNthCalledWith(1, {
            symbol: eth,
            type: DefinitionType.COIN,
        });
        expect(getTokenDefinitionThunk).toHaveBeenNthCalledWith(2, {
            symbol: eth,
            type: DefinitionType.NFT,
        });
        expect(dispatch).toHaveBeenCalledTimes(2);
        expect(dispatch).toHaveBeenCalledWith(mockThunk);
    });

    it('does not refetch existing network definitions', () => {
        const { middleware, dispatch } = initMiddleware({ tokenDefinitions: { [eth]: {} } });

        const action = changeNetworks({ enabledNetworks: [eth] });

        expect(middleware(action)).toBe(action);

        expect(getTokenDefinitionThunk).not.toHaveBeenCalled();
        expect(dispatch).not.toHaveBeenCalled();
    });

    it('reads the state after forwarding the action', () => {
        const { middleware, next, getState } = initMiddleware();
        next.mockImplementation(() => {
            getState.mockReturnValue({ tokenDefinitions: { [eth]: {} } });
        });

        const action = changeNetworks({ enabledNetworks: [eth] });

        expect(middleware(action)).toBe(action);

        expect(getTokenDefinitionThunk).not.toHaveBeenCalled();
    });

    it.each([{ enabledNetworks: [] }, { enabledNetworks: [btc] }])(
        'does not fetch definitions for enabled networks $enabledNetworks',
        ({ enabledNetworks }) => {
            const { middleware, dispatch } = initMiddleware();
            const action = changeNetworks({ enabledNetworks });

            expect(middleware(action)).toBe(action);

            expect(getTokenDefinitionThunk).not.toHaveBeenCalled();
            expect(dispatch).not.toHaveBeenCalled();
        },
    );

    it('forwards unrelated actions without fetching definitions', () => {
        const { middleware, dispatch, next, getState } = initMiddleware();
        const action = { type: 'test/unrelated' };

        expect(middleware(action)).toBe(action);

        expect(next).toHaveBeenCalledWith(action);
        expect(getState).not.toHaveBeenCalled();
        expect(dispatch).not.toHaveBeenCalled();
    });
});
