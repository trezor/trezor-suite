import { combineReducers } from '@reduxjs/toolkit';

import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { createTestStore } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import {
    mockAccountToken,
    mockWalletAccount,
    networkSpecificDefaultCardano,
} from '@suite-common/wallet-types/mocks';
import { type AccountInfo } from '@trezor/connect';
import type { Bip43Path } from '@trezor/crypto-utils';

import { accountsActions } from './accountsActions';
import { type AccountsRootState, prepareAccountsReducer } from './accountsReducer';
import { mockSetAccountAddMetadata } from '../../mocks';

const accountsReducer = prepareAccountsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    actions: { setAccountAddMetadata: mockSetAccountAddMetadata() },
    reducers: { storageLoadAccounts: mockReducer() },
});
const btcSymbol = asNetworkSymbol('btc');
const ltcSymbol = asNetworkSymbol('ltc');

interface InitStoreArgs {
    preloadedState?: AccountsRootState;
}

const initStore = ({ preloadedState }: InitStoreArgs = {}) => {
    const store = createTestStore({
        extra: undefined,
        reducer: { wallet: combineReducers({ accounts: accountsReducer }) },
        preloadedState,
    });

    return store;
};
const getAccount = (a?: Partial<Account>) => ({
    descriptor: 'xpubDeFauLT1',
    symbol: btcSymbol,
    history: {},
    ...a,
});

const testBip43Path: Bip43Path = "m/84'/0'/0'";

describe('Account Reducer', () => {
    // accountActions.createAccount function is already tested by "discoveryActions"
    // it's pointless to write a complex tests for it
    it('Create account', () => {
        const store = initStore();
        store.dispatch(
            accountsActions.createAccount({
                deviceState: '1stTestnetAddress@device_id:0',
                index: 0,
                path: testBip43Path,
                accountType: 'normal',
                symbol: btcSymbol,
                accountInfo: {
                    descriptor: 'XPUB',
                    path: testBip43Path,
                    empty: false,
                    balance: '0',
                    availableBalance: '0',
                    tokens: [],
                    history: {
                        total: 0,
                        transactions: [],
                        unconfirmed: 0,
                    },
                },
                visible: true,
            }),
        );
        expect(store.getState().wallet.accounts.length).toEqual(1);
    });

    it('Create account inserts accounts sorted by coin', () => {
        const store = initStore();
        const createAccountPayload = (
            symbol: Account['symbol'],
            accountType: Account['accountType'],
            index: number,
        ) => ({
            deviceState: '1stTestnetAddress@device_id:0' as const,
            index,
            path: testBip43Path,
            accountType,
            symbol,
            accountInfo: {
                descriptor: `XPUB_${symbol}_${accountType}_${index}`,
                path: testBip43Path,
                empty: false,
                balance: '0',
                availableBalance: '0',
                tokens: [],
                history: {
                    total: 0,
                    transactions: [],
                    unconfirmed: 0,
                },
            },
            visible: true,
        });

        store.dispatch(accountsActions.createAccount(createAccountPayload(ltcSymbol, 'normal', 0)));
        store.dispatch(accountsActions.createAccount(createAccountPayload(btcSymbol, 'legacy', 0)));
        store.dispatch(accountsActions.createAccount(createAccountPayload(btcSymbol, 'normal', 1)));
        store.dispatch(accountsActions.createAccount(createAccountPayload(btcSymbol, 'normal', 0)));

        expect(
            store.getState().wallet.accounts.map(a => `${a.symbol}/${a.accountType}/${a.index}`),
        ).toEqual(['btc/normal/0', 'btc/normal/1', 'btc/legacy/0', 'ltc/normal/0']);
    });

    it('Change account visibility', () => {
        const store = initStore({
            preloadedState: {
                wallet: {
                    accounts: [
                        getAccount({
                            symbol: ltcSymbol,
                            path: testBip43Path,
                            visible: false,
                        }) as Account,
                    ],
                },
            },
        });

        store.dispatch(
            accountsActions.changeAccountVisibility(
                getAccount({
                    symbol: ltcSymbol,
                    path: testBip43Path,
                    visible: false,
                }) as Account,
            ),
        );
        expect(store.getState().wallet.accounts[0]).toEqual(
            getAccount({ symbol: ltcSymbol, path: testBip43Path, visible: true }),
        );
    });

    it('Change account visibility (account not found)', () => {
        const store = initStore();
        const spyWarn = jest.spyOn(console, 'warn').mockImplementation();
        store.dispatch(
            accountsActions.changeAccountVisibility(
                getAccount({
                    symbol: ltcSymbol,
                    path: testBip43Path,
                    visible: false,
                }) as Account,
            ),
        );
        expect(spyWarn).toHaveBeenCalledTimes(1);
        spyWarn.mockRestore();

        expect(store.getState().wallet.accounts.length).toEqual(0);
    });

    describe('cardano staking', () => {
        const delegatedStaking: NonNullable<NonNullable<AccountInfo['misc']>['staking']> = {
            address: 'stake1uxzutrtmxwv2rf2j3hdpps66ch0jydmkr58vwgnetddcdwg32u4rc',
            isActive: true,
            rewards: '173289',
            poolId: 'pool1pu5jlj4q9w9jlxeu370a3c9myx47md5j5m2str0naunn2q3lkdy',
            drep: null,
        };

        // `mockWalletAccount`'s cardano defaults type `poolId` as the literal `null`.
        const cardanoAccount: Account = {
            ...mockWalletAccount(
                { symbol: asNetworkSymbol('ada'), deviceState: '1stTestnetAddress@device_id:0' },
                networkSpecificDefaultCardano,
            ),
            networkType: 'cardano',
            marker: undefined,
            stellarCursor: undefined,
            page: undefined,
            misc: { staking: delegatedStaking },
        };

        it('keeps the delegation when a refresh reports the account without staking data', () => {
            const store = initStore({
                preloadedState: { wallet: { accounts: [cardanoAccount] } },
            });

            store.dispatch(
                accountsActions.updateAccount(cardanoAccount, {
                    descriptor: cardanoAccount.descriptor,
                    balance: '1000',
                    availableBalance: '1000',
                    empty: false,
                    history: { total: 1, unconfirmed: 0, transactions: [] },
                }),
            );

            expect(store.getState().wallet.accounts[0]?.misc).toEqual({
                staking: delegatedStaking,
            });
        });

        it('honors a de-delegation that the payload actually reports', () => {
            const store = initStore({
                preloadedState: { wallet: { accounts: [cardanoAccount] } },
            });

            store.dispatch(
                accountsActions.updateAccount(cardanoAccount, {
                    descriptor: cardanoAccount.descriptor,
                    balance: '1000',
                    availableBalance: '1000',
                    empty: false,
                    history: { total: 1, unconfirmed: 0, transactions: [] },
                    misc: { staking: { ...delegatedStaking, isActive: false, poolId: null } },
                }),
            );

            expect(store.getState().wallet.accounts[0]?.misc).toEqual({
                staking: { ...delegatedStaking, isActive: false, poolId: null },
            });
        });

        it('keeps the delegation when discovery re-creates an account it already knows', () => {
            const store = initStore({
                preloadedState: { wallet: { accounts: [cardanoAccount] } },
            });

            store.dispatch(
                accountsActions.createAccount({
                    deviceState: cardanoAccount.deviceState,
                    index: cardanoAccount.index,
                    path: cardanoAccount.path,
                    accountType: cardanoAccount.accountType,
                    symbol: cardanoAccount.symbol,
                    visible: true,
                    accountInfo: {
                        descriptor: cardanoAccount.descriptor,
                        balance: '1000',
                        availableBalance: '1000',
                        empty: false,
                        history: { total: 1, unconfirmed: 0, transactions: [] },
                    },
                    previousAccount: cardanoAccount,
                }),
            );

            expect(store.getState().wallet.accounts.length).toEqual(1);
            expect(store.getState().wallet.accounts[0]?.misc).toEqual({
                staking: delegatedStaking,
            });
        });
    });

    describe('locally tracked tokens', () => {
        const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

        const ethereumAccount = mockWalletAccount({
            symbol: asNetworkSymbol('eth'),
            deviceState: '1stTestnetAddress@device_id:0',
        });

        const wethAccountToken = mockAccountToken({
            contract: WETH_ADDRESS,
            symbol: 'WETH',
            balance: '1.5',
        });

        const accountInfo: AccountInfo = {
            descriptor: ethereumAccount.descriptor,
            balance: '1000',
            availableBalance: '1000',
            empty: false,
            history: { total: 1, unconfirmed: 0, transactions: [] },
            tokens: [],
            misc: { nonce: '2' },
        };

        const initStoreWithTrackedToken = () =>
            initStore({
                preloadedState: {
                    wallet: {
                        accounts: [{ ...ethereumAccount, tokens: [wethAccountToken] }],
                    },
                },
            });

        it('keeps a locally tracked token when an update from an older snapshot omits it', () => {
            const store = initStoreWithTrackedToken();

            // The stale snapshot and the account info payload know nothing about the token.
            store.dispatch(accountsActions.updateAccount(ethereumAccount, accountInfo));

            expect(store.getState().wallet.accounts[0]?.tokens).toEqual([
                expect.objectContaining({ contract: WETH_ADDRESS, balance: '1.5' }),
            ]);
        });

        it('does not duplicate a tracked token once the update reports it itself', () => {
            const store = initStoreWithTrackedToken();

            store.dispatch(
                accountsActions.updateAccount(ethereumAccount, {
                    ...accountInfo,
                    tokens: [
                        {
                            standard: 'ERC20',
                            contract: WETH_ADDRESS,
                            symbol: 'WETH',
                            name: 'Wrapped Ether',
                            decimals: 18,
                            balance: '2500000000000000000',
                        },
                    ],
                }),
            );

            expect(store.getState().wallet.accounts[0]?.tokens).toEqual([
                expect.objectContaining({ contract: WETH_ADDRESS, balance: '2.5' }),
            ]);
        });

        it('adds tokens to the account via addAccountTokens', () => {
            const store = initStore({
                preloadedState: { wallet: { accounts: [ethereumAccount] } },
            });

            store.dispatch(
                accountsActions.addAccountTokens(ethereumAccount.key, [wethAccountToken]),
            );

            expect(store.getState().wallet.accounts[0]?.tokens).toEqual([
                expect.objectContaining({ contract: WETH_ADDRESS, balance: '1.5' }),
            ]);
        });
    });
});
