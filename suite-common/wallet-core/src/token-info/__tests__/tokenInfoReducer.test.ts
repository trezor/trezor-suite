import { combineReducers } from '@reduxjs/toolkit';

import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

import { type AccountsRootState } from '../../accounts/accountsReducer';
import { prepareTokenInfoReducer } from '../tokenInfoReducer';
import {
    selectCachedTokenDecimals,
    selectTokenDecimals,
    selectTokenInfoEntry,
} from '../tokenInfoSelectors';
import { fetchTokenInfoThunk } from '../tokenInfoThunks';
import { type TokenInfoState } from '../tokenInfoTypes';

jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    default: { blockchainGetContractInfo: jest.fn() },
}));

const mockGetContractInfo = TrezorConnect.blockchainGetContractInfo as jest.Mock;

const SYMBOL = 'eth' as NetworkSymbol;
const CONTRACT = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as TokenAddress;
const CONTRACT_LOWER = CONTRACT.toLowerCase() as TokenAddress;

const successResponse = {
    success: true,
    payload: {
        type: 'ERC20',
        standard: 'ERC20',
        contract: CONTRACT,
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        blockHeight: 1,
    },
};

const failureResponse = {
    success: false,
    error: { message: 'backend unavailable', code: 'Failure_UnknownCode' },
};

const tokenInfoReducer = prepareTokenInfoReducer(extraDependenciesCommonMock);

const initLiveStore = () =>
    configureMockStore({
        reducer: combineReducers({
            wallet: combineReducers({
                tokenInfo: tokenInfoReducer,
            }),
        }),
    });

beforeEach(() => {
    mockGetContractInfo.mockReset();
});

describe('fetchTokenInfoThunk + tokenInfoReducer', () => {
    it('stores decimals/symbol/name/standard on success and clears loading/error', async () => {
        mockGetContractInfo.mockResolvedValue(successResponse);
        const store = initLiveStore();

        await store.dispatch(fetchTokenInfoThunk({ symbol: SYMBOL, contract: CONTRACT }));

        const entry = store.getState().wallet.tokenInfo[SYMBOL]?.[CONTRACT_LOWER];
        expect(entry).toEqual({
            decimals: 6,
            symbol: 'USDC',
            name: 'USD Coin',
            standard: 'ERC20',
            error: false,
        });
    });

    it('calls connect with only { coin, contract } (no currency/protocols)', async () => {
        mockGetContractInfo.mockResolvedValue(successResponse);
        const store = initLiveStore();

        await store.dispatch(fetchTokenInfoThunk({ symbol: SYMBOL, contract: CONTRACT }));

        expect(mockGetContractInfo).toHaveBeenCalledTimes(1);
        expect(mockGetContractInfo).toHaveBeenCalledWith({ coin: SYMBOL, contract: CONTRACT });
    });

    it('marks the entry errored on failure without storing decimals', async () => {
        mockGetContractInfo.mockResolvedValue(failureResponse);
        const store = initLiveStore();

        await store.dispatch(fetchTokenInfoThunk({ symbol: SYMBOL, contract: CONTRACT }));

        const entry = store.getState().wallet.tokenInfo[SYMBOL]?.[CONTRACT_LOWER];
        expect(entry?.error).toBe(true);
        expect(entry?.decimals).toBeUndefined();
    });

    it('dedupes concurrent fetches for the same (symbol, contract) via condition', async () => {
        mockGetContractInfo.mockResolvedValue(successResponse);
        const store = initLiveStore();

        await Promise.all([
            store.dispatch(fetchTokenInfoThunk({ symbol: SYMBOL, contract: CONTRACT })),
            store.dispatch(fetchTokenInfoThunk({ symbol: SYMBOL, contract: CONTRACT })),
            store.dispatch(fetchTokenInfoThunk({ symbol: SYMBOL, contract: CONTRACT })),
        ]);

        expect(mockGetContractInfo).toHaveBeenCalledTimes(1);
    });

    it('skips fetching when decimals are already cached', async () => {
        mockGetContractInfo.mockResolvedValue(successResponse);
        const store = initLiveStore();

        await store.dispatch(fetchTokenInfoThunk({ symbol: SYMBOL, contract: CONTRACT }));
        await store.dispatch(fetchTokenInfoThunk({ symbol: SYMBOL, contract: CONTRACT }));

        expect(mockGetContractInfo).toHaveBeenCalledTimes(1);
    });

    it('normalizes the contract key to lower case', async () => {
        mockGetContractInfo.mockResolvedValue(successResponse);
        const store = initLiveStore();

        await store.dispatch(
            fetchTokenInfoThunk({
                symbol: SYMBOL,
                contract: CONTRACT.toUpperCase() as TokenAddress,
            }),
        );

        expect(selectTokenInfoEntry(store.getState(), SYMBOL, CONTRACT_LOWER)?.decimals).toBe(6);
    });
});

describe('selectTokenDecimals', () => {
    it('returns held-token decimals from the account without a cache entry', () => {
        const accountKey = 'acc-1' as AccountKey;
        const state = {
            wallet: {
                accounts: [
                    {
                        key: accountKey,
                        tokens: [{ contract: CONTRACT, decimals: 18 }],
                    },
                ],
                tokenInfo: {},
            },
        } as unknown as AccountsRootState & { wallet: { tokenInfo: TokenInfoState } };

        expect(selectTokenDecimals(state, SYMBOL, CONTRACT, accountKey)).toBe(18);
    });

    it('falls back to cached decimals when the token is not held', () => {
        const state = {
            wallet: {
                accounts: [],
                tokenInfo: {
                    [SYMBOL]: { [CONTRACT_LOWER]: { decimals: 6, error: false } },
                },
            },
        } as unknown as AccountsRootState & { wallet: { tokenInfo: TokenInfoState } };

        expect(selectTokenDecimals(state, SYMBOL, CONTRACT)).toBe(6);
        expect(selectCachedTokenDecimals(state, SYMBOL, CONTRACT)).toBe(6);
    });

    it('returns null when neither held nor cached', () => {
        const state = {
            wallet: { accounts: [], tokenInfo: {} },
        } as unknown as AccountsRootState & { wallet: { tokenInfo: TokenInfoState } };

        expect(selectTokenDecimals(state, SYMBOL, CONTRACT)).toBeNull();
    });

    it('returns null for an undefined contract address', () => {
        const state = {
            wallet: { accounts: [], tokenInfo: {} },
        } as unknown as AccountsRootState & { wallet: { tokenInfo: TokenInfoState } };

        expect(selectTokenDecimals(state, SYMBOL, undefined)).toBeNull();
    });
});
