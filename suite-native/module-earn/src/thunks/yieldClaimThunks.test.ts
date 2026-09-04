import { combineReducers, isFulfilled, isRejected } from '@reduxjs/toolkit';

import { createTestStore } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type YieldClaimUnsignedTransaction,
    type YieldFlowCompleteRewardItem,
    type YieldRootState,
    selectYieldSession,
    selectYieldTxReview,
    synchronizeSentTransactionThunk,
    yieldActions,
    yieldReducer,
} from '@suite-common/wallet-core';
import {
    type Account,
    type FormState,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import TrezorConnect from '@trezor/connect';
import { type StaticSessionId } from '@trezor/device-utils';

import { pushYieldClaimReviewThunk } from './yieldClaimThunks';

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    ...jest.requireActual('@trezor/connect'),
    default: {
        pushTransaction: jest.fn().mockResolvedValue({
            success: true,
            payload: { txid: '0xpushedtxid' },
        }),
    },
}));

jest.mock('@suite-common/wallet-core', () => ({
    __esModule: true,
    ...jest.requireActual('@suite-common/wallet-core'),
    synchronizeSentTransactionThunk: jest.fn(params => ({
        type: 'test/synchronizeSentTransactionThunk',
        payload: params,
    })),
    selectIsMevProtectionEnabled: () => false,
}));

const STATIC_SESSION_ID: StaticSessionId = '1stTestnetAddress@device_id:0';
const ethSymbol = asNetworkSymbol('eth');
const accountKey = mockAccountKey({
    symbol: ethSymbol,
    descriptor: '0xfffffffffffffffffffffffffffffffffffffffe',
    deviceStaticSessionId: STATIC_SESSION_ID,
});

const account = {
    symbol: ethSymbol,
    networkType: 'ethereum',
    key: accountKey,
    deviceState: STATIC_SESSION_ID,
    descriptor: '0xfffffffffffffffffffffffffffffffffffffffe',
    path: "m/44'/60'/0'/0/0",
    visible: true,
} as unknown as Account;

const unsignedTransaction = {
    to: '0x0000000000000000000000000000000000000001',
    data: '0x1234',
    chainId: 1,
    gasLimit: '21000',
    maxFeePerGas: '20000000000',
    maxPriorityFeePerGas: '2000000000',
    nonce: '1',
} satisfies YieldClaimUnsignedTransaction;

const rewards = [
    {
        token: {
            networkSymbol: ethSymbol,
            symbol: 'USDT',
            decimals: 6,
            contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        },
        value: '1',
        fiatValue: '1',
    },
] satisfies YieldFlowCompleteRewardItem[];

const precomposedForm = {
    outputs: [],
    selectedFee: 'custom',
    feePerUnit: '20',
    feeLimit: '21000',
    options: ['broadcast', 'transactionData'],
    transactionData: '0x1234',
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
} as unknown as FormState;

const precomposedTransaction = {
    type: 'final',
    fee: '420000000000000',
    feePerByte: '20',
    feeLimit: '21000',
    totalSpent: '420000000000000',
    bytes: 0,
    inputs: [],
    outputs: [{ address: unsignedTransaction.to, amount: '0' }],
    outputsPermutation: [0],
} satisfies PrecomposedTransactionFinal;

const pushTransactionMock = TrezorConnect.pushTransaction as jest.Mock;
const synchronizeSentTransactionThunkMock = synchronizeSentTransactionThunk as unknown as jest.Mock;

const buildStore = () =>
    createTestStore({
        extra: undefined,
        reducer: combineReducers({
            wallet: combineReducers({
                stablecoinYield: yieldReducer,
            }),
        }),
    });

const prepareSignedClaimReview = (store: ReturnType<typeof buildStore>) => {
    store.dispatch(yieldActions.initSession({ flowType: 'claim', flowKey: account.key }));
    store.dispatch(
        yieldActions.storeActionReviewData({
            flowType: 'claim',
            flowKey: account.key,
            rewards,
            unsignedTransaction,
        }),
    );
    store.dispatch(
        yieldActions.storePrecomposedTransaction({
            precomposedTx: precomposedTransaction,
            precomposedForm,
            accountKey: account.key,
            flowKey: account.key,
            flowType: 'claim',
        }),
    );
    store.dispatch(
        yieldActions.storeSignedTransaction({
            serializedTx: {
                tx: '0xsignedtx',
                symbol: account.symbol,
            },
        }),
    );
};

const dispatchPush = async (store: ReturnType<typeof buildStore>) => {
    const action = await store.dispatch(
        pushYieldClaimReviewThunk({
            account,
            flowKey: account.key,
        }) as any,
    );

    if (isFulfilled(action)) return { ok: true as const, txid: action.payload.txid };
    if (isRejected(action)) return { ok: false as const, error: action.payload };

    throw new Error('Unexpected dispatch outcome.');
};

describe('pushYieldClaimReviewThunk', () => {
    beforeEach(() => {
        jest.spyOn(Date, 'now').mockReturnValue(1234567890);
        pushTransactionMock.mockClear();
        synchronizeSentTransactionThunkMock.mockClear();
        pushTransactionMock.mockResolvedValue({
            success: true,
            payload: { txid: '0xpushedtxid' },
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('pushes the signed claim tx and stores pending claim metadata', async () => {
        const store = buildStore();
        prepareSignedClaimReview(store);

        const result = await dispatchPush(store);

        expect(result).toEqual({ ok: true, txid: '0xpushedtxid' });
        expect(pushTransactionMock).toHaveBeenCalledWith({
            tx: { hex: '0xsignedtx', disableAlternativeRPC: true },
            coin: account.symbol,
            identity: account.deviceState,
        });
        expect(synchronizeSentTransactionThunkMock).toHaveBeenCalledWith({
            selectedAccount: account,
            precomposedTransaction,
            precomposedForm,
            txid: '0xpushedtxid',
        });

        const state = store.getState() as YieldRootState;
        const session = selectYieldSession(state, 'claim', account.key);

        expect(session.action.pendingTransaction).toEqual({
            type: 'claim',
            txid: '0xpushedtxid',
            amount: '',
            fee: precomposedTransaction.fee,
            submittedAt: 1234567890,
        });
        expect(session.action.review?.type).toBe('claim');
        expect(selectYieldTxReview(state)).toEqual({
            precomposedTx: undefined,
            precomposedForm: undefined,
            availableRewards: undefined,
            serializedTx: undefined,
            accountKey: undefined,
        });
    });

    it('rejects the push when the signed tx belongs to a different flow key', async () => {
        const store = buildStore();
        prepareSignedClaimReview(store);

        const otherFlowKey = 'other-flow-key';
        store.dispatch(yieldActions.initSession({ flowType: 'claim', flowKey: otherFlowKey }));
        store.dispatch(
            yieldActions.storeActionReviewData({
                flowType: 'claim',
                flowKey: otherFlowKey,
                rewards,
                unsignedTransaction,
            }),
        );

        const action = await store.dispatch(
            pushYieldClaimReviewThunk({
                account,
                flowKey: otherFlowKey,
            }) as any,
        );

        expect(isRejected(action)).toBe(true);
        expect(action.payload).toEqual({
            error: 'push-transaction-failed',
            message: 'Transaction not found.',
        });
        expect(pushTransactionMock).not.toHaveBeenCalled();
    });

    it('maps replacement push failure to pending conflict and clears review tx state', async () => {
        const store = buildStore();
        prepareSignedClaimReview(store);
        pushTransactionMock.mockResolvedValue({
            success: false,
            error: { message: 'could not replace existing tx' },
        });

        const result = await dispatchPush(store);

        expect(result).toEqual({
            ok: false,
            error: {
                error: 'push-transaction-pending-conflict',
                message: 'could not replace existing tx',
            },
        });
        expect(synchronizeSentTransactionThunkMock).not.toHaveBeenCalled();
        expect(selectYieldTxReview(store.getState() as YieldRootState)).toEqual({
            precomposedTx: undefined,
            precomposedForm: undefined,
            availableRewards: undefined,
            serializedTx: undefined,
            accountKey: undefined,
        });
    });
});
