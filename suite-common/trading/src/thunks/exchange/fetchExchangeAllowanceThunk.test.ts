import { combineReducers } from '@reduxjs/toolkit';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { fetchAllowance } from '@suite-common/wallet-core';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { asAmountSubunit } from '@suite-common/wallet-utils';
import { mockActionType } from '@trezor/redux-utils/mocks';
import { BigNumber } from '@trezor/utils';

import {
    type FetchExchangeAllowanceThunkState,
    fetchExchangeAllowanceThunk,
} from './fetchExchangeAllowanceThunk';
import { initialState } from '../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../reducers/tradingReducer';
import { selectTradingExchangeAllowance } from '../../selectors/tradingSelectors';

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    fetchAllowance: jest.fn(),
}));

const tradingReducer = prepareTradingReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});

const OWNER_ADDRESS = '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326';
const USDT_CONTRACT = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const SPENDER = '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae';

const ACCOUNT = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    descriptor: asAccountDescriptor(OWNER_ADDRESS),
    tokens: [
        {
            standard: 'ERC20',
            contract: USDT_CONTRACT,
            symbol: 'usdt',
            decimals: 6,
            balance: '100',
        },
    ],
});

const KEY = { accountKey: ACCOUNT.key, tokenContractAddress: USDT_CONTRACT, spender: SPENDER };

const toSubunits = (amount: string) => asAmountSubunit(new BigNumber(amount));

const initStore = (accounts: Account[] = [ACCOUNT]) => {
    const {
        services: { store },
    } = createTestCompositionRoot<void, FetchExchangeAllowanceThunkState>({
        reducer: combineReducers({
            wallet: combineReducers({
                accounts: (state: Account[] = accounts) => state,
                trading: tradingReducer,
            }),
        }),
        preloadedState: { wallet: { accounts, trading: initialState } },
    });

    return store;
};

describe('fetchExchangeAllowanceThunk', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('reads the allowance from the chain and stores it in token units', async () => {
        jest.mocked(fetchAllowance).mockResolvedValue(toSubunits('50000000'));
        const store = initStore();

        await store.dispatch(fetchExchangeAllowanceThunk(KEY)).unwrap();

        expect(fetchAllowance).toHaveBeenCalledWith({
            owner: OWNER_ADDRESS,
            spender: SPENDER,
            tokenContractAddress: USDT_CONTRACT,
            coin: 'eth',
        });
        expect(selectTradingExchangeAllowance(store.getState())).toEqual({
            ...KEY,
            requestId: expect.any(String),
            status: 'loaded',
            amount: '50',
        });
    });

    it('stores an error when the chain read fails', async () => {
        jest.mocked(fetchAllowance).mockRejectedValue(new Error('timeout'));
        const store = initStore();

        await store.dispatch(fetchExchangeAllowanceThunk(KEY)).unwrap();

        expect(selectTradingExchangeAllowance(store.getState())).toEqual({
            ...KEY,
            requestId: expect.any(String),
            status: 'error',
            amount: undefined,
            errorMessage: 'timeout',
        });
    });

    it.each<[string, Account[]]>([
        ['account', []],
        ['token', [{ ...ACCOUNT, tokens: [] }]],
    ])('stores an error without reading the chain for an unknown %s', async (part, accounts) => {
        const store = initStore(accounts);

        await store.dispatch(fetchExchangeAllowanceThunk(KEY)).unwrap();

        expect(fetchAllowance).not.toHaveBeenCalled();
        expect(selectTradingExchangeAllowance(store.getState())).toEqual({
            ...KEY,
            requestId: expect.any(String),
            status: 'error',
            amount: undefined,
            errorMessage: `Unknown ${part}`,
        });
    });

    it('does not start a second read while the same key is being read', async () => {
        let resolveRead: (amount: ReturnType<typeof toSubunits>) => void = () => {};
        jest.mocked(fetchAllowance).mockReturnValue(
            new Promise(resolve => {
                resolveRead = resolve;
            }),
        );
        const store = initStore();

        const firstRead = store.dispatch(fetchExchangeAllowanceThunk(KEY));
        const secondRead = store.dispatch(fetchExchangeAllowanceThunk(KEY));
        resolveRead(toSubunits('50000000'));
        await Promise.all([firstRead, secondRead]);

        expect(fetchAllowance).toHaveBeenCalledTimes(1);
        expect(selectTradingExchangeAllowance(store.getState())).toEqual({
            ...KEY,
            requestId: expect.any(String),
            status: 'loaded',
            amount: '50',
        });
    });

    it('ignores a result that arrives after another key started reading', async () => {
        const otherKey = { ...KEY, spender: '0x1111111111111111111111111111111111111111' };
        let resolveFirstRead: (amount: ReturnType<typeof toSubunits>) => void = () => {};
        jest.mocked(fetchAllowance)
            .mockReturnValueOnce(
                new Promise(resolve => {
                    resolveFirstRead = resolve;
                }),
            )
            .mockResolvedValueOnce(toSubunits('0'));
        const store = initStore();

        const firstRead = store.dispatch(fetchExchangeAllowanceThunk(KEY));
        await store.dispatch(fetchExchangeAllowanceThunk(otherKey)).unwrap();
        resolveFirstRead(toSubunits('50000000'));
        await firstRead;

        expect(selectTradingExchangeAllowance(store.getState())).toEqual({
            ...otherKey,
            requestId: expect.any(String),
            status: 'loaded',
            amount: '0',
        });
    });

    it('ignores a result of an older read of the same key that arrives after a newer one', async () => {
        const otherKey = { ...KEY, spender: '0x1111111111111111111111111111111111111111' };
        let resolveFirstRead: (amount: ReturnType<typeof toSubunits>) => void = () => {};
        jest.mocked(fetchAllowance)
            .mockReturnValueOnce(
                new Promise(resolve => {
                    resolveFirstRead = resolve;
                }),
            )
            .mockResolvedValueOnce(toSubunits('0'))
            .mockResolvedValueOnce(toSubunits('30000000'));
        const store = initStore();

        const firstRead = store.dispatch(fetchExchangeAllowanceThunk(KEY));
        await store.dispatch(fetchExchangeAllowanceThunk(otherKey)).unwrap();
        await store.dispatch(fetchExchangeAllowanceThunk(KEY)).unwrap();
        resolveFirstRead(toSubunits('50000000'));
        await firstRead;

        expect(fetchAllowance).toHaveBeenCalledTimes(3);
        expect(selectTradingExchangeAllowance(store.getState())).toEqual({
            ...KEY,
            requestId: expect.any(String),
            status: 'loaded',
            amount: '30',
        });
    });
});
