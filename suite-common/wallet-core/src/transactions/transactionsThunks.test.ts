import { createTestStore } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type PrecomposedTransactionCardanoFinal,
    asAccountDescriptor,
} from '@suite-common/wallet-types';
import { mockWalletAccount, networkSpecificDefaultCardano } from '@suite-common/wallet-types/mocks';

import { transactionsActions } from './transactionsActions';
import { addFakePendingCardanoTxThunk } from './transactionsThunks';

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
    createTestStore({
        extra: undefined,
        preloadedState: {
            wallet: {
                blockchain: { ada: { blockHeight: BLOCK_HEIGHT } },
            },
        },
    });

const dispatchFakePendingTx = async (
    store: ReturnType<typeof initStore>,
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
