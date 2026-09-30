import { createTestStore } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type FormState,
    type PrecomposedTransactionFinal,
    asAccountDescriptor,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { isSignedByAccount } from '@suite-common/wallet-utils';

import { transactionsActions } from './transactionsActions';
import { addFakePendingCardanoTxThunk, addFakePendingEvmTxThunk } from './transactionsThunks';

const account = {
    key: 'descriptor-ada-device',
    descriptor: 'descriptor',
    deviceState: 'device-state',
    symbol: 'ada',
    networkType: 'cardano',
} as unknown as Account;

const ethAccount = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    descriptor: asAccountDescriptor('0x37567E60ab231b7D7f26B5b34FDD719098E4Ee1b'),
});

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

const dispatchFakePendingTx = async (store: ReturnType<typeof initStore>) => {
    await store.dispatch(
        addFakePendingCardanoTxThunk({
            precomposedTransaction: { totalSpent: '2170000', fee: '170000' },
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

    it('keeps the pending tx alive for 15 minutes worth of Cardano blocks, as Blockfrost only reports the tx once it is confirmed and indexed', async () => {
        const addTransactionAction = await dispatchFakePendingTx(initStore());

        const [transaction] = addTransactionAction?.payload.transactions ?? [];
        const cardanoBlockTimeSeconds = 20;

        expect(transaction?.deadline).toBe(
            BLOCK_HEIGHT + Math.ceil((15 * 60) / cardanoBlockTimeSeconds),
        );
    });
});

describe('addFakePendingEvmTxThunk', () => {
    const initEvmStore = () =>
        createTestStore({
            extra: undefined,
            preloadedState: {
                wallet: {
                    blockchain: { eth: { blockHeight: BLOCK_HEIGHT } },
                    fees: { eth: { data: { blockTime: 1 } } },
                },
            },
        });

    const dispatchFakePendingEvmTx = async () => {
        const store = initEvmStore();

        await store.dispatch(
            addFakePendingEvmTxThunk({
                precomposedTransaction: {
                    outputs: [
                        {
                            address: '0x0000000000000000000000000000000000000001',
                            amount: '1000000000000000000',
                        },
                    ],
                    fee: '21000',
                    feeLimit: '21000',
                    feePerByte: '1',
                } as unknown as PrecomposedTransactionFinal,
                precomposedForm: {} as FormState,
                txid: '0xtest-txid',
                account: ethAccount,
                ethereumNonce: '48',
            }),
        );

        const [transaction] =
            store.getActions().find(transactionsActions.addTransaction.match)?.payload
                .transactions ?? [];

        return transaction;
    };

    // isSignedByAccount is what every EVM nonce set is filtered through, and it reads details.vin.
    // buildFakePendingEvmTx is the only producer that writes that field by hand, so if it ever
    // stopped, the account's own in-flight sends would silently vanish from the nonce arithmetic
    // and the next send would collide with them.
    it('produces a transaction the account is recognised as having signed', async () => {
        const transaction = await dispatchFakePendingEvmTx();

        expect(transaction).toBeDefined();
        expect(isSignedByAccount(transaction!)).toBe(true);
    });
});
