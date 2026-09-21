import { createTestStore } from '@suite-common/test-utils';
import { type Account } from '@suite-common/wallet-types';

import { transactionsActions } from './transactionsActions';
import { addFakePendingCardanoTxThunk, addFakePendingStellarTxThunk } from './transactionsThunks';

const account = {
    key: 'descriptor-ada-device',
    descriptor: 'descriptor',
    deviceState: 'device-state',
    symbol: 'ada',
    networkType: 'cardano',
} as unknown as Account;

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

describe(addFakePendingStellarTxThunk.name, () => {
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
        createTestStore({
            extra: undefined,
            preloadedState: { wallet: { blockchain: { xlm: { blockHeight: BLOCK_HEIGHT } } } },
        });

    const dispatchStellarFakeTx = async (
        precomposedTransaction: Record<string, unknown>,
        memo?: string,
    ) => {
        const store = initStellarStore();
        await store.dispatch(
            addFakePendingStellarTxThunk({
                precomposedTransaction: precomposedTransaction as any,
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
