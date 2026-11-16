import { combineReducers } from '@reduxjs/toolkit';

import {
    type TestCompositionStore,
    createTestCompositionRoot,
    testMocks,
} from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type PrecomposedTransactionCardanoFinal,
    type SolanaTxMeta,
    type StakeType,
    asAccountDescriptor,
} from '@suite-common/wallet-types';
import {
    mockWalletAccount,
    networkSpecificDefaultCardano,
    networkSpecificDefaultRipple,
    networkSpecificDefaultSolana,
    networkSpecificDefaultStellar,
} from '@suite-common/wallet-types/mocks';
import { isPending } from '@suite-common/wallet-utils';
import TrezorConnect, { type AccountInfo } from '@trezor/connect';
import {
    SOLANA_BLOCKHASH_VALIDITY_BLOCKS,
    SOLANA_SLOT_TIME_MS,
} from '@trezor/network-solana/constants';
import { createMockDispatch, mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import { transactionsActions } from './transactionsActions';
import { prepareTransactionsReducer, transactionsInitialState } from './transactionsReducer';
import { selectAreAllAccountTransactionsLoaded } from './transactionsSelectors';
import {
    type AddFakePendingCardanoTxThunkState,
    type AddFakePendingSolanaTxThunkState,
    type AddFakePendingStellarTxThunkState,
    type FetchTransactionsPageThunkState,
    addFakePendingCardanoTxThunk,
    addFakePendingSolanaSendTxThunk,
    addFakePendingSolanaStakeTxThunk,
    addFakePendingStellarTxThunk,
    fetchTransactionsPageThunk,
    hasTransactionsPageAfter,
} from './transactionsThunks';
import { mockSetAccountAddMetadata } from '../../mocks';
import { prepareAccountsReducer } from '../accounts/accountsReducer';
import { blockchainInitialState } from '../blockchain/blockchainReducer';
import { stellarContractTokensInitialState } from '../token/stellarContractTokensSlice';

jest.mock('@trezor/connect', () => {
    const actual = jest.requireActual('@trezor/connect');

    return {
        ...actual,
        __esModule: true,
        default: { ...actual.default, getAccountInfo: jest.fn() },
    };
});

const OWN_ADDRESS = 'addr1-own';
const OWN_PATH = "m/1852'/1815'/0'/0/0";
const CHANGE_ADDRESS = 'addr1-change';
const CHANGE_PATH = "m/1852'/1815'/0'/1/0";
const RECIPIENT_ADDRESS = 'addr1-recipient';
const PREV_TXID = 'ab'.repeat(32);
const POLICY_ID = 'policy-id';
const ASSET_NAME_HEX = '544f4b';
const TOKEN_UNIT = POLICY_ID + ASSET_NAME_HEX;

const createAddress = (address: string, path: string) => ({
    address,
    path,
    transfers: 1,
    balance: '0',
    sent: '0',
    received: '0',
});

const createUtxo = (amount: string, unit?: string) => ({
    txid: PREV_TXID,
    vout: 0,
    confirmations: 10,
    address: OWN_ADDRESS,
    path: OWN_PATH,
    amount,
    blockHeight: 90,
    cardanoSpecific: unit ? { unit } : undefined,
});

const account = mockWalletAccount(
    {
        symbol: asNetworkSymbol('ada'),
        descriptor: asAccountDescriptor('descriptor'),
        addresses: {
            change: [createAddress(CHANGE_ADDRESS, CHANGE_PATH)],
            used: [createAddress(OWN_ADDRESS, OWN_PATH)],
            unused: [],
        },
        utxo: [createUtxo('5000000'), createUtxo('7', TOKEN_UNIT)],
        tokens: [
            {
                standard: 'BLOCKFROST',
                contract: TOKEN_UNIT,
                name: 'Token',
                symbol: 'TOK',
                decimals: 2,
                balance: '7',
            },
        ],
    },
    networkSpecificDefaultCardano,
);

type PrecomposedTransaction = Pick<
    PrecomposedTransactionCardanoFinal,
    'totalSpent' | 'fee' | 'inputs' | 'outputs'
>;

const precomposedTransaction: PrecomposedTransaction = {
    totalSpent: '2170000',
    fee: '170000',
    inputs: [{ path: OWN_PATH, prev_hash: PREV_TXID, prev_index: 0 }],
    outputs: [
        { address: RECIPIENT_ADDRESS, amount: '2000000' },
        { addressParameters: { addressType: 0, path: CHANGE_PATH }, amount: '2830000' },
    ],
};

const BLOCK_HEIGHT = 100;

const initStore = () =>
    createTestCompositionRoot<void, AddFakePendingCardanoTxThunkState>({
        preloadedState: {
            wallet: {
                blockchain: { ada: { blockHeight: BLOCK_HEIGHT } },
            },
        },
    }).services.store;

const dispatchFakePendingTx = async (
    store: TestCompositionStore<AddFakePendingCardanoTxThunkState, void>,
    transaction: PrecomposedTransaction = precomposedTransaction,
) => {
    await store.dispatch(
        addFakePendingCardanoTxThunk({
            precomposedTransaction: transaction,
            txid: 'test-txid',
            account,
        }),
    );

    return store.getActions().find(transactionsActions.addTransaction.match);
};

describe('addFakePendingCardanoTxThunk', () => {
    it('stores the pending tx with the fee excluded from the amount, matching the confirmed tx from blockfrost', async () => {
        const addTransactionAction = await dispatchFakePendingTx(initStore());

        expect(addTransactionAction?.payload.transactions).toEqual([
            expect.objectContaining({
                txid: 'test-txid',
                type: 'sent',
                amount: '2000000',
                fee: '170000',
                totalSpent: '2170000',
                blockHash: undefined,
                deadline: 145,
            }),
        ]);
    });

    it('fills targets and inputs/outputs from the precomposed tx, excluding the change output from targets', async () => {
        const addTransactionAction = await dispatchFakePendingTx(initStore());

        const [transaction] = addTransactionAction?.payload.transactions ?? [];

        expect(transaction?.targets).toEqual([
            {
                n: 0,
                addresses: [RECIPIENT_ADDRESS],
                isAddress: true,
                amount: '2000000',
                isAccountTarget: undefined,
            },
        ]);
        expect(transaction?.details).toEqual({
            vin: [
                {
                    n: 0,
                    addresses: [OWN_ADDRESS],
                    isAddress: true,
                    value: '5000000',
                    isAccountOwned: true,
                },
            ],
            vout: [
                {
                    n: 0,
                    addresses: [RECIPIENT_ADDRESS],
                    isAddress: true,
                    value: '2000000',
                    isAccountOwned: undefined,
                },
                {
                    n: 1,
                    addresses: [CHANGE_ADDRESS],
                    isAddress: true,
                    value: '2830000',
                    isAccountOwned: true,
                },
            ],
            size: 0,
            totalInput: '5000000',
            totalOutput: '4830000',
        });
    });

    it('reports a native token transfer to the recipient, like the confirmed tx from blockfrost', async () => {
        const addTransactionAction = await dispatchFakePendingTx(initStore(), {
            totalSpent: '1370000',
            fee: '170000',
            inputs: [{ path: OWN_PATH, prev_hash: PREV_TXID, prev_index: 0 }],
            outputs: [
                {
                    address: RECIPIENT_ADDRESS,
                    amount: '1200000',
                    tokenBundle: [
                        {
                            policyId: POLICY_ID,
                            tokenAmounts: [{ assetNameBytes: ASSET_NAME_HEX, amount: '5' }],
                        },
                    ],
                },
                {
                    addressParameters: { addressType: 0, path: CHANGE_PATH },
                    amount: '3630000',
                    tokenBundle: [
                        {
                            policyId: POLICY_ID,
                            tokenAmounts: [{ assetNameBytes: ASSET_NAME_HEX, amount: '2' }],
                        },
                    ],
                },
            ],
        });

        const [transaction] = addTransactionAction?.payload.transactions ?? [];

        expect(transaction?.amount).toBe('1200000');
        expect(transaction?.tokens).toEqual([
            {
                type: 'sent',
                standard: 'BLOCKFROST',
                amount: '5',
                from: 'descriptor',
                to: RECIPIENT_ADDRESS,
                contract: TOKEN_UNIT,
                name: 'Token',
                symbol: 'TOK',
                decimals: 2,
            },
        ]);
    });

    it('marks a tx whose outputs all belong to the account as sent to self, with only the fee as the amount', async () => {
        const addTransactionAction = await dispatchFakePendingTx(initStore(), {
            totalSpent: '170000',
            fee: '170000',
            inputs: [{ path: OWN_PATH, prev_hash: PREV_TXID, prev_index: 0 }],
            outputs: [
                { address: OWN_ADDRESS, amount: '2000000' },
                { addressParameters: { addressType: 0, path: CHANGE_PATH }, amount: '2830000' },
            ],
        });

        const [transaction] = addTransactionAction?.payload.transactions ?? [];

        expect(transaction).toEqual(
            expect.objectContaining({
                type: 'self',
                amount: '170000',
                targets: [
                    {
                        n: 0,
                        addresses: [OWN_ADDRESS],
                        isAddress: true,
                        amount: '2000000',
                        isAccountTarget: true,
                    },
                ],
                tokens: [],
            }),
        );
    });

    it('keeps the pending tx alive for 15 minutes worth of Cardano blocks, as Blockfrost only reports the tx once it is confirmed and indexed', async () => {
        const addTransactionAction = await dispatchFakePendingTx(initStore());

        const [transaction] = addTransactionAction?.payload.transactions ?? [];
        const cardanoBlockTimeSeconds = 20;

        expect(transaction?.deadline).toBe(
            BLOCK_HEIGHT + Math.ceil((15 * 60) / cardanoBlockTimeSeconds),
        );
    });
});

describe('addFakePendingStellarTxThunk', () => {
    const stellarAccount = {
        key: 'GAXSFOOGF4ELO5HT5PTN23T5XE6D5QWL3YBHSVQ2HWOFEJNYYMRJENBV-xlm-device',
        descriptor: 'GAXSFOOGF4ELO5HT5PTN23T5XE6D5QWL3YBHSVQ2HWOFEJNYYMRJENBV',
        deviceState: 'device-state',
        symbol: 'xlm',
        networkType: 'stellar',
    } as unknown as Account;
    const recipient = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
    const contractToken = {
        standard: 'STELLAR-CONTRACT',
        contract: 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 7,
    };

    const initStellarStore = () =>
        createTestCompositionRoot<void, AddFakePendingStellarTxThunkState>({
            preloadedState: { wallet: { blockchain: { xlm: { blockHeight: BLOCK_HEIGHT } } } },
        }).services.store;

    const dispatchStellarFakeTx = async (
        stellarPrecomposedTransaction: Record<string, unknown>,
        memo?: string,
    ) => {
        const store = initStellarStore();
        await store.dispatch(
            addFakePendingStellarTxThunk({
                precomposedTransaction: stellarPrecomposedTransaction as any,
                memo,
                txid: 'stellar-hash',
                account: stellarAccount,
            }),
        );

        return store.getActions().find(transactionsActions.addTransaction.match)?.payload
            .transactions[0];
    };

    it('stores a native payment with the amount in stroops, its memo and a ledger-based deadline', async () => {
        const transaction = await dispatchStellarFakeTx(
            { outputs: [{ address: recipient, amount: '50000000' }], fee: '100' },
            'invoice 42',
        );

        expect(transaction).toEqual(
            expect.objectContaining({
                txid: 'stellar-hash',
                type: 'sent',
                amount: '50000000',
                fee: '100',
                blockHash: undefined,
                targets: [{ n: 0, addresses: [recipient], isAddress: true, amount: '50000000' }],
                tokens: [],
                stellarSpecific: {
                    memo: 'invoice 42',
                    feeSource: stellarAccount.descriptor,
                    operationType: 'payment',
                },
                deadline: BLOCK_HEIGHT + Math.ceil((15 * 60) / 5),
            }),
        );
    });

    it('stores a contract-token transfer as a token movement in base units with no native amount', async () => {
        const transaction = await dispatchStellarFakeTx({
            outputs: [{ address: recipient, amount: '50000000' }],
            fee: '1234',
            token: contractToken,
        });

        expect(transaction).toEqual(
            expect.objectContaining({
                type: 'sent',
                amount: '0',
                fee: '1234',
                targets: [],
                tokens: [
                    expect.objectContaining({
                        type: 'sent',
                        standard: 'STELLAR-CONTRACT',
                        contract: contractToken.contract,
                        amount: '50000000',
                        decimals: 7,
                        from: stellarAccount.descriptor,
                        to: recipient,
                    }),
                ],
                stellarSpecific: expect.objectContaining({
                    memo: undefined,
                    operationType: 'invokeHostFunction',
                }),
            }),
        );
    });

    it('does nothing for an account of another network', async () => {
        const store = initStellarStore();
        await store.dispatch(
            addFakePendingStellarTxThunk({
                precomposedTransaction: {
                    outputs: [{ address: recipient, amount: '1' }],
                    fee: '1',
                } as any,
                txid: 'x',
                account: { ...stellarAccount, networkType: 'ripple' } as Account,
            }),
        );

        expect(store.getActions().find(transactionsActions.addTransaction.match)).toBeUndefined();
    });
});

describe('Solana fake pending transactions', () => {
    const SOL_DESCRIPTOR = asAccountDescriptor('soldescriptor');
    const SOL_RECIPIENT = 'sol-recipient';
    const SOL_FEE = '5000';
    const SOL_DEADLINE = BLOCK_HEIGHT + Math.ceil((3 * 60) / (SOLANA_SLOT_TIME_MS / 1000));

    const solanaAccount = mockWalletAccount(
        { symbol: asNetworkSymbol('sol'), descriptor: SOL_DESCRIPTOR },
        networkSpecificDefaultSolana,
    );

    const state: AddFakePendingSolanaTxThunkState = {
        wallet: {
            blockchain: {
                ...blockchainInitialState,
                sol: { ...blockchainInitialState.sol, blockHeight: BLOCK_HEIGHT },
            },
        },
    };
    const getState = () => state;

    const getAddedTransaction = (actions: unknown[]) =>
        actions.find(transactionsActions.addTransaction.match)?.payload.transactions[0];

    describe('addFakePendingSolanaSendTxThunk', () => {
        it('stores a native transfer as sent with the fee included in the amount', async () => {
            const { actions, dispatch } = createMockDispatch({ getState });

            await addFakePendingSolanaSendTxThunk({
                precomposedTransaction: {
                    outputs: [{ address: SOL_RECIPIENT, amount: '1000' }],
                    fee: SOL_FEE,
                },
                txid: 'sol-send-txid',
                account: solanaAccount,
            })(dispatch, getState, {});

            expect(getAddedTransaction(actions)).toEqual(
                expect.objectContaining({
                    txid: 'sol-send-txid',
                    type: 'sent',
                    amount: '6000',
                    fee: SOL_FEE,
                    targets: [
                        { n: 0, addresses: [SOL_RECIPIENT], isAddress: true, amount: '1000' },
                    ],
                    tokens: [],
                    internalTransfers: [],
                    solanaSpecific: undefined,
                    deadline: SOL_DEADLINE,
                }),
            );
        });
    });

    describe('addFakePendingSolanaStakeTxThunk', () => {
        const dispatchStakeTransaction = async (
            stakeType: StakeType,
            solanaTxMeta?: SolanaTxMeta,
            fee = SOL_FEE,
        ) => {
            const { actions, dispatch } = createMockDispatch({ getState });

            await addFakePendingSolanaStakeTxThunk({
                precomposedTransaction: {
                    outputs: [{ address: SOL_DESCRIPTOR, amount: '1000' }],
                    fee,
                    solanaTxMeta,
                },
                stakeType,
                txid: `sol-${stakeType}-txid`,
                account: solanaAccount,
            })(dispatch, getState, {});

            return getAddedTransaction(actions);
        };

        it('stores a claim as a pending stake operation that credits the account', async () => {
            const transaction = await dispatchStakeTransaction('claim');

            expect(transaction).toEqual(
                expect.objectContaining({
                    txid: 'sol-claim-txid',
                    type: 'sent',
                    amount: '0',
                    fee: SOL_FEE,
                    targets: [],
                    internalTransfers: [
                        { type: 'recv', from: '', to: SOL_DESCRIPTOR, amount: '1000' },
                    ],
                    solanaSpecific: {
                        status: 'pending',
                        stakeOperation: { type: 'claim', amount: '1000' },
                    },
                    deadline: SOL_DEADLINE,
                }),
            );
            expect(transaction && isPending(transaction)).toBe(true);
        });

        it('expires with the blockhash of the stake when the metadata carries its last valid height', async () => {
            const transaction = await dispatchStakeTransaction('stake', {
                deviceAmountLamports: '1000',
                feeLamports: SOL_FEE,
                rentLamports: '0',
                feeIncludingRentLamports: SOL_FEE,
                lastValidBlockHeight: 1000,
            });

            expect(transaction?.deadline).toBe(1000 + SOLANA_BLOCKHASH_VALIDITY_BLOCKS);
        });

        it('stores a stake with the staked amount and the fee as the balance change', async () => {
            const transaction = await dispatchStakeTransaction('stake');

            expect(transaction).toEqual(
                expect.objectContaining({
                    type: 'sent',
                    amount: '6000',
                    internalTransfers: [],
                    solanaSpecific: {
                        status: 'pending',
                        stakeOperation: { type: 'stake', amount: '1000' },
                    },
                }),
            );
        });

        it('stores an unstake without a balance change', async () => {
            const transaction = await dispatchStakeTransaction('unstake');

            expect(transaction).toEqual(
                expect.objectContaining({
                    type: 'sent',
                    amount: '0',
                    internalTransfers: [],
                    solanaSpecific: {
                        status: 'pending',
                        stakeOperation: { type: 'unstake', amount: '1000' },
                    },
                }),
            );
        });

        it('prefers the amount the device reviewed over the form output', async () => {
            const transaction = await dispatchStakeTransaction('claim', {
                deviceAmountLamports: '2500',
                feeLamports: SOL_FEE,
                rentLamports: '0',
                feeIncludingRentLamports: SOL_FEE,
            });

            expect(transaction?.solanaSpecific?.stakeOperation?.amount).toBe('2500');
        });

        it('counts the rent of a new stake account once and reports the bare network fee', async () => {
            const RENT = '2282880';
            const transaction = await dispatchStakeTransaction(
                'stake',
                {
                    deviceAmountLamports: '2283880',
                    feeLamports: SOL_FEE,
                    rentLamports: RENT,
                    feeIncludingRentLamports: '2287880',
                },
                '2287880',
            );

            expect(transaction).toEqual(
                expect.objectContaining({
                    amount: '2288880',
                    fee: SOL_FEE,
                    solanaSpecific: {
                        status: 'pending',
                        stakeOperation: { type: 'stake', amount: '2283880' },
                    },
                }),
            );
        });

        it('does nothing for an account on another network', async () => {
            const { actions, dispatch } = createMockDispatch({ getState });

            await addFakePendingSolanaStakeTxThunk({
                precomposedTransaction: {
                    outputs: [{ address: OWN_ADDRESS, amount: '1000' }],
                    fee: SOL_FEE,
                },
                stakeType: 'claim',
                txid: 'ada-claim-txid',
                account,
            })(dispatch, getState, {});

            expect(getAddedTransaction(actions)).toBeUndefined();
        });
    });
});

describe(hasTransactionsPageAfter.name, () => {
    const page = (transactionCount: number, total?: number) =>
        ({
            history: { transactions: Array.from({ length: transactionCount }, () => ({})) },
            ...(total === undefined ? {} : { page: { total } }),
        }) as unknown as AccountInfo;

    it('has one more while the reported total is not reached', () => {
        expect(hasTransactionsPageAfter(page(25, 3), 1)).toBe(true);
        expect(hasTransactionsPageAfter(page(25, 3), 3)).toBe(false);
    });

    it('takes the total of an earlier page when a response leaves it out', () => {
        expect(hasTransactionsPageAfter(page(25), 1)).toBe(false);
        expect(hasTransactionsPageAfter(page(25), 1, 3)).toBe(true);
    });

    it('ends at an empty page, however many the backend reports', () => {
        expect(hasTransactionsPageAfter(page(0, 10), 1, 10)).toBe(false);
    });

    it('has one more while a cursor is handed over', () => {
        const withMarker = { ...page(25), marker: { ledger: 1, seq: 1 } } as AccountInfo;

        expect(hasTransactionsPageAfter(withMarker, 1)).toBe(true);
    });

    it('has one more when the page was stored before', () => {
        expect(hasTransactionsPageAfter('ALREADY_FETCHED', 9)).toBe(true);
    });
});

describe('fetchTransactionsPageThunk after an account sync', () => {
    const PER_PAGE = 25;
    const MAX_PAGES = 10;

    const accountsReducer = prepareAccountsReducer({
        actionTypes: { storageLoad: mockActionType('storageLoad') },
        actions: { setAccountAddMetadata: mockSetAccountAddMetadata() },
        reducers: { storageLoadAccounts: mockReducer() },
    });
    const transactionsReducer = prepareTransactionsReducer({
        actionTypes: { storageLoad: mockActionType('storageLoad') },
        reducers: { storageLoadTransactions: mockReducer() },
    });

    const getTransactions = (from: number, count: number) =>
        Array.from({ length: count }, (_, index) =>
            testMocks.getWalletTransaction({
                txid: `tx-${from + index}`,
                blockHeight: 1000 - from - index,
            }),
        );

    const getAccountInfo = (transactions: AccountInfo['history']['transactions']) =>
        ({
            descriptor: 'descriptor',
            balance: '0',
            availableBalance: '0',
            empty: false,
            history: { total: -1, unconfirmed: 0, transactions },
        }) as AccountInfo;

    const PAGE_1 = getTransactions(0, PER_PAGE);

    // The account list loads the page after the last one until the history reports its end.
    const walkHistory = async (
        { symbol }: Pick<Account, 'symbol'>,
        networkSpecific: typeof networkSpecificDefaultStellar | typeof networkSpecificDefaultRipple,
        responses: AccountInfo[],
    ) => {
        const syncedAccount = mockWalletAccount(
            { symbol, history: { total: -1, unconfirmed: 0 } },
            networkSpecific,
        );
        const { store } = createTestCompositionRoot<void, FetchTransactionsPageThunkState>({
            reducer: combineReducers({
                wallet: combineReducers({
                    accounts: accountsReducer,
                    transactions: transactionsReducer,
                    blockchain: (state = blockchainInitialState) => state,
                    stellarContractTokens: (state = stellarContractTokensInitialState) => state,
                }),
            }),
            preloadedState: {
                wallet: {
                    accounts: [syncedAccount],
                    transactions: transactionsInitialState,
                    blockchain: blockchainInitialState,
                    stellarContractTokens: stellarContractTokensInitialState,
                },
            },
        }).services;

        // An account sync stores page 1 the way fetchAndUpdateAccountThunk does: no page, no status.
        store.dispatch(
            transactionsActions.addTransaction({ account: syncedAccount, transactions: PAGE_1 }),
        );

        const getAccountInfoMock = jest.mocked(TrezorConnect.getAccountInfo);
        // Without a cursor the backend serves the history from its top again.
        getAccountInfoMock.mockResolvedValue({
            success: true,
            payload: getAccountInfo(PAGE_1),
        } as any);
        responses.forEach(payload =>
            getAccountInfoMock.mockResolvedValueOnce({ success: true, payload } as any),
        );

        const requestedPages: number[] = [];
        for (let page = 2; page <= MAX_PAGES; page++) {
            if (selectAreAllAccountTransactionsLoaded(store.getState(), syncedAccount.key)) break;

            requestedPages.push(page);
            await store
                .dispatch(
                    fetchTransactionsPageThunk({
                        accountKey: syncedAccount.key,
                        page,
                        perPage: PER_PAGE,
                    }),
                )
                .unwrap();
        }

        return requestedPages;
    };

    afterEach(() => {
        jest.mocked(TrezorConnect.getAccountInfo).mockReset();
    });

    it('stops a cursor-paged history at its first empty page', async () => {
        const requestedPages = await walkHistory(
            { symbol: asNetworkSymbol('xlm') },
            networkSpecificDefaultStellar,
            [
                { ...getAccountInfo(getTransactions(25, 10)), stellarCursor: 'cursor-2' },
                { ...getAccountInfo([]), stellarCursor: 'cursor-2' },
            ],
        );

        expect(requestedPages).toEqual([2, 3]);
    });

    it('stops a marker-paged history at its first page without a marker', async () => {
        const requestedPages = await walkHistory(
            { symbol: asNetworkSymbol('xrp') },
            networkSpecificDefaultRipple,
            [
                { ...getAccountInfo(getTransactions(25, 25)), marker: { ledger: 1, seq: 1 } },
                getAccountInfo(getTransactions(50, 10)),
            ],
        );

        expect(requestedPages).toEqual([2, 3]);
    });
});
