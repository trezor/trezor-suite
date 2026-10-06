import { combineReducers, createReducer } from '@reduxjs/toolkit';

import {
    accountsActions,
    fetchWrappedNativeTokenInfo,
    yieldReducer,
} from '@suite-common/wallet-core';
import { type Account, type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import {
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
    waitFor,
} from '@suite-native/test-utils-store';

import { useRefreshWrappedNativeTokenOnFocus } from './useRefreshWrappedNativeTokenOnFocus';

let capturedFocusHandler: (() => void) | undefined;

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useFocusEffect: (handler: () => void) => {
        capturedFocusHandler = handler;
        require('react').useEffect(handler, [handler]);
    },
}));

jest.mock('@suite-common/wallet-core/src/yield/utils/fetchWrappedNativeTokenInfo');

const fetchWrappedNativeTokenInfoMock = jest.mocked(fetchWrappedNativeTokenInfo);

const accountKey = 'eth-account-key' as AccountKey;
const wethTokenContract = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as TokenAddress;

const account = {
    key: accountKey,
    symbol: 'eth',
    networkType: 'ethereum',
    descriptor: '0x0000000000000000000000000000000000000001',
    formattedBalance: '0',
    tokens: [],
} as unknown as Account;

type AddAccountTokensPayload = ReturnType<typeof accountsActions.addAccountTokens>['payload'];

const buildStore = () =>
    createLightStore({
        reducer: {
            addedTokens: createReducer<AddAccountTokensPayload[]>([], builder => {
                builder.addCase(accountsActions.addAccountTokens, (state, action) => {
                    state.push(action.payload);
                });
            }),
            locale: createStaticReducer({
                appLocaleCode: 'en-US',
                systemLocaleCode: 'en-US',
                isSystemLocaleUsed: true,
            }),
            wallet: combineReducers({
                accounts: createStaticReducer([account]),
                settings: createStaticReducer({
                    localCurrency: 'usd',
                    bitcoinAmountUnit: 0,
                }),
                stablecoinYield: yieldReducer,
            }),
        },
    });

describe('useRefreshWrappedNativeTokenOnFocus', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fetchWrappedNativeTokenInfoMock.mockResolvedValue(null);
    });

    it('tracks the wrapped token once a lookup that failed on mount succeeds on the next focus', async () => {
        fetchWrappedNativeTokenInfoMock.mockRejectedValueOnce(new Error('Lookup failed.'));
        fetchWrappedNativeTokenInfoMock.mockResolvedValueOnce({
            standard: 'ERC20',
            contract: wethTokenContract,
            symbol: 'WETH',
            name: 'Wrapped Ether',
            decimals: 18,
            balance: '2500000000000000000',
        });
        const store = buildStore();

        await renderHookWithStoreProvider(
            () => useRefreshWrappedNativeTokenOnFocus({ accountKey, isEnabled: true }),
            { services: { store } },
        );

        await waitFor(() => expect(fetchWrappedNativeTokenInfoMock).toHaveBeenCalledTimes(1));
        expect(store.getState().addedTokens).toEqual([]);

        act(() => {
            capturedFocusHandler?.();
        });

        await waitFor(() =>
            expect(store.getState().addedTokens).toEqual([
                {
                    accountKey,
                    tokens: [expect.objectContaining({ contract: wethTokenContract })],
                },
            ]),
        );
    });

    it('does not look the token up while disabled', async () => {
        const store = buildStore();

        await renderHookWithStoreProvider(
            () => useRefreshWrappedNativeTokenOnFocus({ accountKey, isEnabled: false }),
            { services: { store } },
        );

        expect(fetchWrappedNativeTokenInfoMock).not.toHaveBeenCalled();
    });

    it('does not look the token up without an account', async () => {
        const store = buildStore();

        await renderHookWithStoreProvider(
            () => useRefreshWrappedNativeTokenOnFocus({ accountKey: undefined, isEnabled: true }),
            { services: { store } },
        );

        expect(fetchWrappedNativeTokenInfoMock).not.toHaveBeenCalled();
    });
});
