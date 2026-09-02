import { combineReducers, isFulfilled, isRejected } from '@reduxjs/toolkit';

import { selectSelectedDevice } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestStore } from '@suite-common/test-utils';
import {
    type YieldFlowResolvedData,
    type YieldFlowToken,
    type YieldPositionFlowType,
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

import { pushYieldActionReviewThunk, signYieldActionReviewThunk } from './yieldTransactionThunks';

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    ...jest.requireActual('@trezor/connect'),
    default: {
        ethereumSignTransaction: jest.fn(),
        pushTransaction: jest.fn().mockResolvedValue({
            success: true,
            payload: { txid: '0xpushedtxid' },
        }),
    },
}));

jest.mock('@suite-common/device', () => ({
    __esModule: true,
    ...jest.requireActual('@suite-common/device'),
    selectSelectedDevice: jest.fn(),
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
const FLOW_KEY = 'flow-key';
const OTHER_FLOW_KEY = 'other-flow-key';

const buildAccount = (descriptor: string) => {
    const accountKey = mockAccountKey({
        symbol: 'eth',
        descriptor,
        deviceStaticSessionId: STATIC_SESSION_ID,
    });

    return {
        symbol: 'eth',
        networkType: 'ethereum',
        key: accountKey,
        deviceState: STATIC_SESSION_ID,
        descriptor,
        path: "m/44'/60'/0'/0/0",
        visible: true,
    } as unknown as Account;
};

const account = buildAccount('0xfffffffffffffffffffffffffffffffffffffffe');
const otherAccount = buildAccount('0xfffffffffffffffffffffffffffffffffffffffd');

const wethVaultToken = {
    networkSymbol: account.symbol,
    symbol: 'weth',
    decimals: 18,
    contractAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    balance: '1',
} satisfies YieldFlowToken;

const buildFlowData = (flowAccount: Account, token?: YieldFlowToken) =>
    ({ account: flowAccount, token }) as unknown as YieldFlowResolvedData;

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
    outputs: [{ address: '0x0000000000000000000000000000000000000001', amount: '0' }],
    outputsPermutation: [0],
} satisfies PrecomposedTransactionFinal;

const pushTransactionMock = TrezorConnect.pushTransaction as jest.Mock;
const ethereumSignTransactionMock = TrezorConnect.ethereumSignTransaction as jest.Mock;
const synchronizeSentTransactionThunkMock = synchronizeSentTransactionThunk as unknown as jest.Mock;
const selectSelectedDeviceMock = selectSelectedDevice as jest.Mock;

const buildStore = () =>
    createTestStore({
        extra: undefined,
        reducer: combineReducers({
            wallet: combineReducers({
                stablecoinYield: yieldReducer,
            }),
        }),
    });

type PrepareParams = {
    store: ReturnType<typeof buildStore>;
    flowType: YieldPositionFlowType;
    flowKey: string;
};

const prepareActionReview = ({ store, flowType, flowKey }: PrepareParams) => {
    store.dispatch(yieldActions.initSession({ flowType, flowKey }));
    store.dispatch(
        yieldActions.storeActionReviewData({
            flowType,
            flowKey,
            amount: '100',
            receiptAmount: '99',
            unsignedTransaction: '0xunsignedtx',
        }),
    );
};

const storeSignedTransaction = ({
    flowType,
    flowKey,
    store,
}: PrepareParams & { store: ReturnType<typeof buildStore> }) => {
    store.dispatch(
        yieldActions.storePrecomposedTransaction({
            precomposedTx: precomposedTransaction,
            precomposedForm,
            accountKey: account.key,
            flowKey,
            flowType,
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

type DispatchPushParams = {
    store: ReturnType<typeof buildStore>;
    flowType: YieldPositionFlowType;
    flowKey: string;
    flowAccount?: Account;
};

const dispatchPush = async ({
    store,
    flowType,
    flowKey,
    flowAccount = account,
}: DispatchPushParams) => {
    const action = await store.dispatch(
        pushYieldActionReviewThunk({
            flowData: buildFlowData(flowAccount),
            flowKey,
            flowType,
        }) as any,
    );

    if (isFulfilled(action)) return { ok: true as const, txid: action.payload.txid };
    if (isRejected(action)) return { ok: false as const, error: action.payload };

    throw new Error('Unexpected dispatch outcome.');
};

describe('pushYieldActionReviewThunk', () => {
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

    it('pushes the signed deposit tx and stores pending deposit metadata', async () => {
        const store = buildStore();
        prepareActionReview({ store, flowType: 'deposit', flowKey: FLOW_KEY });
        storeSignedTransaction({ store, flowType: 'deposit', flowKey: FLOW_KEY });

        const result = await dispatchPush({ store, flowType: 'deposit', flowKey: FLOW_KEY });

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
        const session = selectYieldSession(state, 'deposit', FLOW_KEY);

        expect(session.action.pendingTransaction).toEqual({
            type: 'deposit',
            txid: '0xpushedtxid',
            amount: '100',
            fee: precomposedTransaction.fee,
            submittedAt: 1234567890,
        });
        expect(selectYieldTxReview(state).serializedTx).toBeUndefined();
    });

    it('rejects the push when the signed tx belongs to a different account', async () => {
        const store = buildStore();
        prepareActionReview({ store, flowType: 'deposit', flowKey: FLOW_KEY });
        storeSignedTransaction({ store, flowType: 'deposit', flowKey: FLOW_KEY });

        const result = await dispatchPush({
            store,
            flowType: 'deposit',
            flowKey: FLOW_KEY,
            flowAccount: otherAccount,
        });

        expect(result).toEqual({
            ok: false,
            error: { error: 'push-transaction-failed', message: 'Transaction not found.' },
        });
        expect(pushTransactionMock).not.toHaveBeenCalled();
    });

    it('rejects the withdraw push when the signed tx belongs to a deposit flow', async () => {
        const store = buildStore();
        prepareActionReview({ store, flowType: 'deposit', flowKey: FLOW_KEY });
        storeSignedTransaction({ store, flowType: 'deposit', flowKey: FLOW_KEY });
        prepareActionReview({ store, flowType: 'withdraw', flowKey: FLOW_KEY });

        const result = await dispatchPush({ store, flowType: 'withdraw', flowKey: FLOW_KEY });

        expect(result).toEqual({
            ok: false,
            error: { error: 'push-transaction-failed', message: 'Transaction not found.' },
        });
        expect(pushTransactionMock).not.toHaveBeenCalled();
    });

    it('rejects the push when the signed tx belongs to a different flow key', async () => {
        const store = buildStore();
        prepareActionReview({ store, flowType: 'deposit', flowKey: FLOW_KEY });
        storeSignedTransaction({ store, flowType: 'deposit', flowKey: FLOW_KEY });
        prepareActionReview({ store, flowType: 'deposit', flowKey: OTHER_FLOW_KEY });

        const result = await dispatchPush({ store, flowType: 'deposit', flowKey: OTHER_FLOW_KEY });

        expect(result).toEqual({
            ok: false,
            error: { error: 'push-transaction-failed', message: 'Transaction not found.' },
        });
        expect(pushTransactionMock).not.toHaveBeenCalled();
    });
});

describe('signYieldActionReviewThunk', () => {
    beforeEach(() => {
        ethereumSignTransactionMock.mockClear();
        selectSelectedDeviceMock.mockReset();
    });

    it('rejects a wrapped-native vault deposit on firmware below 2.12.4 without signing on the device', async () => {
        const store = buildStore();
        prepareActionReview({ store, flowType: 'deposit', flowKey: FLOW_KEY });
        selectSelectedDeviceMock.mockReturnValue(
            mockSuiteDevice({}, { major_version: 2, minor_version: 12, patch_version: 3 }),
        );

        const action = await store.dispatch(
            signYieldActionReviewThunk({
                flowData: buildFlowData(account, wethVaultToken),
                flowKey: FLOW_KEY,
                flowType: 'deposit',
            }) as any,
        );

        expect(isRejected(action)).toBe(true);
        expect(action.payload).toMatchObject({
            error: 'sign-transaction-failed',
            message: 'Firmware does not support this yield action.',
        });
        expect(ethereumSignTransactionMock).not.toHaveBeenCalled();
    });
});
