import { getUnixTime } from 'date-fns';

import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import {
    mockWalletAccount,
    networkSpecificDefaultCardano,
    networkSpecificDefaultEthereum,
} from '@suite-common/wallet-types/mocks';
import { type BlockchainBlock } from '@trezor/connect';

import * as cardanoStakingActions from 'src/actions/wallet/cardanoStakingActions';
import { transactionsReducer } from 'src/reducers/wallet';
import cardanoStakingReducer from 'src/reducers/wallet/cardanoStakingReducer';
import { configureStore } from 'src/support/tests/configureStore';
import { type WalletAccountTransaction } from 'src/types/wallet';

import { CARDANO_STAKING } from '../constants';

const cardanoAccount = mockWalletAccount(
    {
        symbol: 'ada',
        descriptor: asAccountDescriptor('addr123'),
        deviceState: '1stTestnetAddress@device_id:0',
    },
    networkSpecificDefaultCardano,
);

const defaultAccount = mockWalletAccount(
    {
        descriptor: asAccountDescriptor('0xFA01a39f8Abaeb660c3137f14A310d0b414b2A15'),
        symbol: 'eth',
        deviceState: '1stTestnetAddress@device_id:0',
    },
    networkSpecificDefaultEthereum,
);

type CardanoStakingState = ReturnType<typeof cardanoStakingReducer>;

const getInitialState = (cardanoStaking?: CardanoStakingState) => ({
    devices: [],
    suite: {
        device: mockSuiteDevice({ available: true, connected: true }),
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
                    accountKey: 'addr123-ada-1stTestnetAddress@device_id:0',
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
