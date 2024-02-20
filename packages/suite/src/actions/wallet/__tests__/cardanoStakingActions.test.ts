import { testMocks } from '@suite-common/test-utils';
import { configureStore } from 'src/support/tests/configureStore';

import cardanoStakingReducer from 'src/reducers/wallet/cardanoStakingReducer';
import * as cardanoStakingActions from 'src/actions/wallet/cardanoStakingActions';
import { CARDANO_STAKING } from '../constants';
import { WalletAccountTransaction } from 'src/types/wallet';
import { BlockchainBlock } from '@trezor/connect';
import { transactionsReducer } from 'src/reducers/wallet';
import { getUnixTime } from 'date-fns';

const { getSuiteDevice } = testMocks;
const cardanoAccount = testMocks.getWalletAccount({
    networkType: 'cardano',
    symbol: 'ada',
    descriptor: 'addr123',
});
const defaultAccount = testMocks.getWalletAccount();
type CardanoStakingState = ReturnType<typeof cardanoStakingReducer>;
const getInitialState = (cardanoStaking?: CardanoStakingState) => ({
    devices: [],
    suite: {
        device: getSuiteDevice({ available: true, connected: true }),
    },
    wallet: {
        accounts: [defaultAccount, cardanoAccount],
        blockchain: {
            ada: {
                blockHeight: 1,
            },
        },

        transactions: transactionsReducer(undefined, { type: 'foo' } as any),

        cardanoStaking: cardanoStaking ?? cardanoStakingReducer(undefined, { type: 'foo' } as any),
    },
});

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>();

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { cardanoStaking } = store.getState().wallet;
        store.getState().wallet.cardanoStaking = cardanoStakingReducer(cardanoStaking, action);
        // add action back to stack
        store.getActions().push(action);
    });

    return store;
};

describe('cardanoStakingActions', () => {
    it('Add pending stake tx and clear it after tx is confirmed', async () => {
        const store = initStore(getInitialState());

        await store.dispatch(cardanoStakingActions.setPendingStakeTx(cardanoAccount, 'txid123'));
        const pendingTx = await store.dispatch(
            cardanoStakingActions.getPendingStakeTx(cardanoAccount),
        );
        expect(store.getActions()).toMatchObject([
            {
                type: CARDANO_STAKING.ADD_PENDING_STAKE_TX,
                pendingStakeTx: {
                    accountKey:
                        'addr123-ada-7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
                    txid: 'txid123',
                },
            },
        ]);

        expect(pendingTx?.txid).toEqual('txid123');

        store.dispatch(
            cardanoStakingActions.validatePendingStakeTxOnTx(cardanoAccount, [
                { txid: 'completelyDifferentTx' } as WalletAccountTransaction,
            ]),
        );
        const stillPending = await store.dispatch(
            cardanoStakingActions.getPendingStakeTx(cardanoAccount),
        );
        expect(stillPending?.txid).toEqual('txid123');

        // receive transaction
        // validatePendingStakeTxOnTx will be triggered from walletMiddleware on addTransaction action
        store.dispatch(
            cardanoStakingActions.validatePendingStakeTxOnTx(cardanoAccount, [
                { txid: 'txid123', blockHeight: 10, blockTime: 3 } as WalletAccountTransaction,
            ]),
        );

        const noSoPendingTx = await store.dispatch(
            cardanoStakingActions.getPendingStakeTx(cardanoAccount),
        );
        expect(noSoPendingTx).toEqual(undefined);
    });

    it('Add pending stake tx and clear it after TTL expires', async () => {
        const store = initStore(getInitialState());

        await store.dispatch(cardanoStakingActions.setPendingStakeTx(cardanoAccount, 'txid123'));
        const pendingTx = await store.dispatch(
            cardanoStakingActions.getPendingStakeTx(cardanoAccount),
        );
        expect(pendingTx?.txid).toEqual('txid123');

        // less than TTL elapsed, tx should still be there
        store.dispatch(
            cardanoStakingActions.validatePendingTxOnBlock({
                block: {
                    coin: {
                        shortcut: 'ada',
                    },
                    blockHeight: 8,
                } as BlockchainBlock,
                timestamp: getUnixTime(new Date()) + 1000,
            }),
        );
        const stillPending = await store.dispatch(
            cardanoStakingActions.getPendingStakeTx(cardanoAccount),
        );
        expect(stillPending?.txid).toEqual('txid123');

        // more than 7200 secs since pushing the transaction to a blockchain
        // validatePendingStakeTxOnBlock will be triggered from blockchainMiddleware on BLOCKCHAIN.BLOCK
        store.dispatch(
            cardanoStakingActions.validatePendingTxOnBlock({
                block: {
                    coin: { shortcut: 'ada' },
                    blockHeight: 15,
                } as BlockchainBlock,
                timestamp: getUnixTime(new Date()) + 7300,
            }),
        );

        const noSoPendingTx = await store.dispatch(
            cardanoStakingActions.getPendingStakeTx(cardanoAccount),
        );
        expect(noSoPendingTx).toEqual(undefined);
    });
});
