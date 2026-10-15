import { type TestCompositionStore, createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type PrecomposedTransactionCardanoFinal,
    type WalletAccountTransaction,
    asAccountDescriptor,
} from '@suite-common/wallet-types';
import { mockWalletAccount, networkSpecificDefaultCardano } from '@suite-common/wallet-types/mocks';
import { enhanceTransaction, hasUnresolvedInputs } from '@suite-common/wallet-utils';
import TrezorConnect, { type AccountTransaction } from '@trezor/connect';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import {
    RESOLVED_FEE,
    UNRESOLVED_TXID,
    accountWithUnresolvedInputs,
    getFullTransaction,
    getUnresolvedTransaction,
    resolvedForeignInput,
} from './__fixtures__/unresolvedInputs';
import { transactionsActions } from './transactionsActions';
import {
    type AddFakePendingCardanoTxThunkState,
    type AddFakePendingStellarTxThunkState,
    type FetchUtxoTransactionsForAccountThunkState,
    type ResolveTransactionInputsThunkState,
    addFakePendingCardanoTxThunk,
    addFakePendingStellarTxThunk,
    fetchUtxoTransactionsForAccountThunk,
    resolveTransactionInputsThunk,
} from './transactionsThunks';

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

const getStoredTransaction = (transaction: AccountTransaction) =>
    enhanceTransaction(transaction, accountWithUnresolvedInputs);

const getTransactionsState = (
    transactions: WalletAccountTransaction[],
    transactionsAccount: Account = accountWithUnresolvedInputs,
): ResolveTransactionInputsThunkState & FetchUtxoTransactionsForAccountThunkState => ({
    wallet: {
        accounts: [transactionsAccount],
        transactions: {
            transactions: { [transactionsAccount.key]: transactions },
            phishing: {},
            fetchStatusDetail: {},
        },
    },
});

const mockGetTransactions = (transactions: AccountTransaction[]) =>
    jest
        .spyOn(TrezorConnect, 'blockchainGetTransactions')
        .mockResolvedValue({ success: true, payload: transactions });

describe('resolveTransactionInputsThunk', () => {
    const params = { accountKey: accountWithUnresolvedInputs.key, txid: UNRESOLVED_TXID };

    const resolveInputs = (transactions: WalletAccountTransaction[]) => {
        const getState = () => getTransactionsState(transactions);
        const { actions, dispatch } = createMockDispatch({ getState, extra: {} });
        const run = () => resolveTransactionInputsThunk(params)(dispatch, getState, {}).unwrap();
        const getReplaceActions = () =>
            actions.filter(transactionsActions.replaceTransaction.match);

        return { run, getReplaceActions };
    };

    afterEach(() => jest.restoreAllMocks());

    it('replaces the transaction with the inputs and fee of the one fetched without the account', async () => {
        const getTransactions = mockGetTransactions([getFullTransaction()]);
        const { run, getReplaceActions } = resolveInputs([
            getStoredTransaction(getUnresolvedTransaction()),
        ]);

        expect(await run()).toBe(true);

        expect(getTransactions).toHaveBeenCalledWith({
            coin: 'btc',
            identity: undefined,
            txs: [UNRESOLVED_TXID],
        });
        const [replaceAction] = getReplaceActions();
        expect(replaceAction?.payload).toEqual({
            key: accountWithUnresolvedInputs.key,
            txid: UNRESOLVED_TXID,
            tx: expect.objectContaining({
                type: 'joint',
                amount: '4000',
                fee: RESOLVED_FEE,
                feeRate: '5',
            }),
        });
        const resolved = replaceAction?.payload.tx;
        expect(resolved?.details.vin[1]).toEqual(resolvedForeignInput);
        expect(resolved?.details.totalInput).toBe('25000');
        expect(resolved && hasUnresolvedInputs(resolved)).toBe(false);
    });

    it('computes the replace-by-fee parameters again with the fee', async () => {
        mockGetTransactions([getFullTransaction()]);
        const stored = getStoredTransaction(getUnresolvedTransaction());
        const { run, getReplaceActions } = resolveInputs([stored]);

        await run();

        expect(stored.rbfParams).toMatchObject({ baseFee: 0 });
        expect(getReplaceActions()[0]?.payload.tx.rbfParams).toMatchObject({
            baseFee: Number(RESOLVED_FEE),
            utxo: [expect.objectContaining({ amount: '5000' })],
        });
    });

    it('fetches nothing for a transaction with all input values, like one of Blockbook', async () => {
        const getTransactions = mockGetTransactions([getFullTransaction()]);
        const { run, getReplaceActions } = resolveInputs([
            getStoredTransaction(getFullTransaction()),
        ]);

        expect(await run()).toBe(true);
        expect(getTransactions).not.toHaveBeenCalled();
        expect(getReplaceActions()).toEqual([]);
    });

    it('fetches nothing for an unknown transaction', async () => {
        const getTransactions = mockGetTransactions([getFullTransaction()]);
        const { run } = resolveInputs([]);

        expect(await run()).toBe(false);
        expect(getTransactions).not.toHaveBeenCalled();
    });

    it('keeps the transaction when it cannot be fetched', async () => {
        jest.spyOn(TrezorConnect, 'blockchainGetTransactions').mockResolvedValue({
            success: false,
            error: { message: 'Transaction not found', code: 'Failure_UnknownCode' },
        });
        const { run, getReplaceActions } = resolveInputs([
            getStoredTransaction(getUnresolvedTransaction()),
        ]);

        expect(await run()).toBe(false);
        expect(getReplaceActions()).toEqual([]);
    });

    it('keeps the transaction when the backend gives it without the input values again', async () => {
        mockGetTransactions([getUnresolvedTransaction()]);
        const { run, getReplaceActions } = resolveInputs([
            getStoredTransaction(getUnresolvedTransaction()),
        ]);

        expect(await run()).toBe(false);
        expect(getReplaceActions()).toEqual([]);
    });

    it('fetches a transaction once for calls waiting at the same time', async () => {
        const getTransactions = mockGetTransactions([getFullTransaction()]);
        const { run, getReplaceActions } = resolveInputs([
            getStoredTransaction(getUnresolvedTransaction()),
        ]);

        expect(await Promise.all([run(), run()])).toEqual([true, true]);
        expect(getTransactions).toHaveBeenCalledTimes(1);
        expect(getReplaceActions()).toHaveLength(1);
    });

    it('completes the transaction as it is once fetched, e.g. confirmed meanwhile', async () => {
        let storedTransactions = [getStoredTransaction(getUnresolvedTransaction())];
        const confirmed = getStoredTransaction(getUnresolvedTransaction({ blockHeight: 100 }));
        jest.spyOn(TrezorConnect, 'blockchainGetTransactions').mockImplementation(() => {
            storedTransactions = [confirmed];

            return Promise.resolve({ success: true, payload: [getFullTransaction()] });
        });
        const getState = () => getTransactionsState(storedTransactions);
        const { actions, dispatch } = createMockDispatch({ getState, extra: {} });

        await resolveTransactionInputsThunk(params)(dispatch, getState, {}).unwrap();

        const [replaceAction] = actions.filter(transactionsActions.replaceTransaction.match);
        expect(replaceAction?.payload.tx).toMatchObject({ blockHeight: 100, fee: RESOLVED_FEE });
        // A confirmed transaction can't be replaced anymore.
        expect(replaceAction?.payload.tx.rbfParams).toBeUndefined();
    });
});

describe('fetchUtxoTransactionsForAccountThunk', () => {
    const confirmedTxid = 'ee'.repeat(32);
    const newTxid = 'ff'.repeat(32);

    const getUtxo = (txid: string, vout: number) => ({
        txid,
        vout,
        amount: '1000',
        blockHeight: 1,
        address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        path: "m/84'/0'/0'/0/0",
        confirmations: 1,
    });

    const confirmedTransaction = getStoredTransaction({
        ...getUnresolvedTransaction({ blockHeight: 100 }),
        txid: confirmedTxid,
    });
    const pendingTransaction = getStoredTransaction(getUnresolvedTransaction());

    const fetchUtxoTransactions = (utxoAccount: Account) => {
        const getState = () =>
            getTransactionsState([confirmedTransaction, pendingTransaction], utxoAccount);
        const { dispatch } = createMockDispatch({ getState, extra: {} });

        return fetchUtxoTransactionsForAccountThunk({ accountKey: utxoAccount.key })(
            dispatch,
            getState,
            {},
        ).unwrap();
    };

    afterEach(() => jest.restoreAllMocks());

    it('fetches only the transactions of the UTXOs which are not confirmed in the store', async () => {
        const getTransactions = mockGetTransactions([]);

        await fetchUtxoTransactions({
            ...accountWithUnresolvedInputs,
            utxo: [
                getUtxo(confirmedTxid, 0),
                getUtxo(UNRESOLVED_TXID, 0),
                getUtxo(newTxid, 0),
                getUtxo(newTxid, 1),
            ],
        });

        expect(getTransactions).toHaveBeenCalledWith({
            coin: 'btc',
            txs: [UNRESOLVED_TXID, newTxid],
            descriptor: accountWithUnresolvedInputs.descriptor,
        });
    });

    it('fetches nothing when the transactions of all the UTXOs are confirmed in the store', async () => {
        const getTransactions = mockGetTransactions([]);

        const transactions = await fetchUtxoTransactions({
            ...accountWithUnresolvedInputs,
            utxo: [getUtxo(confirmedTxid, 0), getUtxo(confirmedTxid, 1)],
        });

        expect(getTransactions).not.toHaveBeenCalled();
        expect(transactions).toEqual([confirmedTransaction, pendingTransaction]);
    });
});
