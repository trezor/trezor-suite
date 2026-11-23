import { combineReducers } from '@reduxjs/toolkit';

import { type AnalyticsSharedEvents } from '@suite-common/analytics';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockGetTradedAccountKeys, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import TrezorConnect, { type TokenInfo } from '@trezor/connect';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import { prepareAccountsReducer } from './accountsReducer';
import { selectAccountByKey } from './accountsSelectors';
import {
    type FetchAndUpdateAccountThunkDeps,
    type FetchAndUpdateAccountThunkState,
    fetchAndUpdateAccountThunk,
} from './accountsThunks';
import { mockSetAccountAddMetadata } from '../../mocks';
import { customTokensActions, customTokensReducer } from '../token/customTokensSlice';

const accountsReducer = prepareAccountsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    actions: { setAccountAddMetadata: mockSetAccountAddMetadata() },
    reducers: { storageLoadAccounts: mockReducer() },
});

const contract = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const account = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    history: { total: 0, unconfirmed: 0 },
    tokens: [],
});
const accountKey = account.key;

const usdt = (balance: string): TokenInfo => ({
    standard: 'ERC20',
    contract,
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    balance,
});

const keep =
    <T>(initial: T) =>
    (state: T = initial) =>
        state;

const initStore = (preloaded: {
    tokens?: TokenInfo[];
    customTokens?: string[];
    account?: typeof account;
}) =>
    createTestCompositionRoot<FetchAndUpdateAccountThunkDeps, FetchAndUpdateAccountThunkState>({
        reducer: {
            wallet: combineReducers({
                accounts: accountsReducer,
                customTokens: customTokensReducer,
                stellarContractTokens: keep({}),
                transactions: keep({ transactions: {} }),
                blockchain: keep({ eth: { blockHeight: 1 } }),
                settings: keep({}),
            }),
            device: keep({ devices: [] }),
            notifications: keep([]),
            tokenDefinitions: keep({}),
        } as any,
        preloadedState: {
            wallet: {
                accounts: [{ ...(preloaded.account ?? account), tokens: preloaded.tokens ?? [] }],
                customTokens: preloaded.customTokens
                    ? {
                          [accountKey]: preloaded.customTokens.map(c => ({
                              contract: c,
                              addedAt: 0,
                          })),
                      }
                    : {},
            },
        },
        services: () => ({
            analytics: mockAnalytics<AnalyticsSharedEvents>(),
            getTradedAccountKeys: mockGetTradedAccountKeys(),
        }),
    }).services.store;

// The backend reports one new transaction and no tokens; `onContractRead` answers the per-contract
// reads the refresh makes for tokens the backend left out.
const mockBackend = (onContractRead: () => Promise<unknown>) =>
    jest.spyOn(TrezorConnect, 'getAccountInfo').mockImplementation(((params: any) => {
        if (params.contractFilter) return onContractRead();

        return Promise.resolve({
            success: true,
            payload: {
                descriptor: account.descriptor,
                balance: '0',
                availableBalance: '0',
                empty: false,
                history: { total: 1, unconfirmed: 0, transactions: [] },
                tokens: [],
                misc: { nonce: '1' },
            },
        });
    }) as any);

const selectTokens = (store: ReturnType<typeof initStore>) =>
    selectAccountByKey(store.getState(), accountKey)?.tokens;

describe(fetchAndUpdateAccountThunk.name, () => {
    afterEach(() => jest.restoreAllMocks());

    it('reads a token the user added that the account no longer lists', async () => {
        mockBackend(() =>
            Promise.resolve({ success: true, payload: { tokens: [usdt('2000000')] } }),
        );
        const store = initStore({ customTokens: [contract] });

        await store.dispatch(fetchAndUpdateAccountThunk({ accountKey }));

        expect(selectTokens(store)).toEqual([expect.objectContaining({ contract, balance: '2' })]);
    });

    it('keeps an added token with its balance when reading it fails', async () => {
        mockBackend(() => Promise.resolve({ success: false, payload: { error: 'boom' } }));
        const store = initStore({
            tokens: [{ ...usdt('1.5') }],
            customTokens: [contract],
        });

        await store.dispatch(fetchAndUpdateAccountThunk({ accountKey }));

        expect(selectTokens(store)).toEqual([
            expect.objectContaining({ contract, balance: '1.5' }),
        ]);
    });

    it('does not write back a token removed while it was being read', async () => {
        const store = initStore({ tokens: [{ ...usdt('1') }], customTokens: [contract] });
        mockBackend(() => {
            store.dispatch(
                customTokensActions.removeCustomToken({
                    accountKey,
                    symbol: account.symbol,
                    contract,
                }),
            );
            store.dispatch({
                type: '@common/wallet-core/accounts/removeAccountTokens',
                payload: { accountKey, contracts: [contract] },
            });

            return Promise.resolve({ success: true, payload: { tokens: [usdt('1000000')] } });
        });

        await store.dispatch(fetchAndUpdateAccountThunk({ accountKey }));

        expect(selectTokens(store)).toEqual([]);
    });

    it('reads a Cardano asset the backend left out although it reported another of its policy', async () => {
        const policyId = 'a'.repeat(56);
        const reported = `${policyId}01`;
        const leftOut = `${policyId}02`;
        const cardanoAccount = mockWalletAccount({
            symbol: asNetworkSymbol('ada'),
            history: { total: 0, unconfirmed: 0 },
            tokens: [],
        });
        const asset = (assetContract: string): TokenInfo => ({
            standard: 'BLOCKFROST',
            contract: assetContract,
            decimals: 0,
            balance: '1',
        });
        const getAccountInfo = jest.spyOn(TrezorConnect, 'getAccountInfo').mockImplementation(((
            params: any,
        ) =>
            Promise.resolve({
                success: true,
                payload: params.contractFilter
                    ? { tokens: [] }
                    : {
                          descriptor: cardanoAccount.descriptor,
                          balance: '0',
                          availableBalance: '0',
                          empty: false,
                          history: { total: 1, unconfirmed: 0, transactions: [] },
                          tokens: [asset(reported)],
                          misc: {},
                      },
            })) as any);
        const store = initStore({
            account: cardanoAccount,
            tokens: [asset(reported), asset(leftOut)],
        });

        await store.dispatch(fetchAndUpdateAccountThunk({ accountKey: cardanoAccount.key }));

        expect(getAccountInfo).toHaveBeenCalledWith(
            expect.objectContaining({ contractFilter: leftOut }),
        );
    });
});
