import { combineReducers } from '@reduxjs/toolkit';
import { type CryptoId, type ExchangeTrade } from 'invity-api';

import {
    act,
    createTestCompositionRoot,
    renderHookWithStoreProvider,
} from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { fetchAllowance } from '@suite-common/wallet-core';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { asAmountSubunit } from '@suite-common/wallet-utils';
import { mockActionType } from '@trezor/redux-utils/mocks';
import { BigNumber } from '@trezor/utils';

import { useTradingExchangeAllowance } from './useTradingExchangeAllowance';
import { initialState } from '../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../reducers/tradingReducer';
import { type FetchExchangeAllowanceThunkState } from '../thunks/exchange/fetchExchangeAllowanceThunk';

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
// ERC-20 `approve(spender, amount)` calldata: selector + 32-byte spender + 32-byte amount.
const APPROVE_CALLDATA = `0x095ea7b3${SPENDER.slice(2).padStart(64, '0')}${'1'.padStart(64, '0')}`;

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

const APPROVAL_QUOTE: ExchangeTrade = {
    send: `ethereum--${USDT_CONTRACT}` as CryptoId,
    status: 'APPROVAL_REQ',
    preapprovedStringAmount: '50',
    dexTx: { from: OWNER_ADDRESS, to: USDT_CONTRACT, value: '0', data: APPROVE_CALLDATA },
};

const renderAllowance = (selectedQuote: ExchangeTrade | undefined = APPROVAL_QUOTE) => {
    const preloadedState: FetchExchangeAllowanceThunkState = {
        wallet: {
            accounts: [ACCOUNT],
            trading: { ...initialState, exchange: { ...initialState.exchange, selectedQuote } },
        },
    };
    const { services } = createTestCompositionRoot<void, FetchExchangeAllowanceThunkState>({
        reducer: combineReducers({
            wallet: combineReducers({
                accounts: (state: Account[] = [ACCOUNT]) => state,
                trading: tradingReducer,
            }),
        }),
        preloadedState,
    });

    return renderHookWithStoreProvider(() => useTradingExchangeAllowance({ account: ACCOUNT }), {
        services,
    });
};

describe('useTradingExchangeAllowance', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('reads the allowance of the selected quote from the chain', async () => {
        jest.mocked(fetchAllowance).mockResolvedValue(asAmountSubunit(new BigNumber('20000000')));

        const { result } = renderAllowance();

        expect(result.current.currentAllowance).toEqual({ amount: '50', source: 'provider' });

        await act(async () => {
            await Promise.resolve();
        });

        expect(fetchAllowance).toHaveBeenCalledTimes(1);
        expect(result.current.currentAllowance).toEqual({ amount: '20', source: 'chain' });
        expect(result.current.allowanceKey).toEqual({
            accountKey: ACCOUNT.key,
            tokenContractAddress: USDT_CONTRACT,
            spender: expect.any(String),
        });
    });

    it('does not read anything without approve calldata on the quote', () => {
        const { result } = renderAllowance({ ...APPROVAL_QUOTE, dexTx: undefined });

        expect(fetchAllowance).not.toHaveBeenCalled();
        expect(result.current.allowanceKey).toBeUndefined();
        expect(result.current.currentAllowance).toEqual({ amount: '50', source: 'provider' });
    });

    it('reads once and re-reads only on request', async () => {
        jest.mocked(fetchAllowance).mockResolvedValue(asAmountSubunit(new BigNumber('0')));

        const { result, rerender } = renderAllowance();

        await act(async () => {
            await Promise.resolve();
        });
        rerender();

        expect(fetchAllowance).toHaveBeenCalledTimes(1);

        await act(async () => {
            await result.current.refetchAllowance();
        });

        expect(fetchAllowance).toHaveBeenCalledTimes(2);
    });
});
