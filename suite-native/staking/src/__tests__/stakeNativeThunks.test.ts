import { combineReducers, isFulfilled, isRejected } from '@reduxjs/toolkit';

import { messageSystemInitialState } from '@suite-common/message-system';
import { buildStakeData } from '@suite-common/staking';
import { type TrezorDevice } from '@suite-common/suite-types';
import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import { prepareSendFormReducer } from '@suite-common/wallet-core';
import {
    type Account,
    type AccountKey,
    type FormState,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { getFormDraftKey } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';

import { signStakeTransactionNativeThunk } from '../stakeNativeThunks';

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    ...jest.requireActual('@trezor/connect'),
    default: {
        ethereumSignTransaction: jest.fn().mockResolvedValue({
            success: true,
            payload: { serializedTx: '0xsignedtx' },
        }),
        pushTransaction: jest.fn().mockResolvedValue({
            success: true,
            payload: { txid: '0xpushedtxid' },
        }),
    },
}));

jest.mock('@suite-native/device-mutex', () => ({
    requestPrioritizedDeviceAccess: async (callback: () => Promise<unknown>) => ({
        success: true,
        payload: await callback(),
    }),
}));

const STATIC_SESSION_ID = '1stTestnetAddress@device_id:0';
const ETH_ACCOUNT_KEY = 'eth1' as AccountKey;
const SOL_ACCOUNT_KEY = 'sol1' as AccountKey;
const POOL_ADDRESS = '0xD523794C879D9eC028960a231F866758e405bE34';

const ethAccount: Account = {
    symbol: 'eth',
    networkType: 'ethereum',
    key: ETH_ACCOUNT_KEY,
    deviceState: STATIC_SESSION_ID,
    descriptor: '0xfffffffffffffffffffffffffffffffffffffffe',
    path: "m/44'/60'/0'/0/0",
    visible: true,
    misc: { nonce: '7' },
} as unknown as Account;

const solAccount: Account = {
    symbol: 'sol',
    networkType: 'solana',
    key: SOL_ACCOUNT_KEY,
    deviceState: STATIC_SESSION_ID,
    visible: true,
} as unknown as Account;

const buildStore = ({
    accounts = [ethAccount],
    formDrafts = {},
}: {
    accounts?: Account[];
    formDrafts?: Record<string, FormState>;
} = {}) =>
    configureMockStore({
        reducer: combineReducers({
            device: (): { selectedDevice: TrezorDevice } => ({
                selectedDevice: {
                    path: 'device-id:1',
                    instance: 1,
                    state: { sessionId: '1', staticSessionId: STATIC_SESSION_ID },
                    useEmptyPassphrase: true,
                } as unknown as TrezorDevice,
            }),
            messageSystem: () => messageSystemInitialState,
            wallet: combineReducers({
                accounts: () => accounts,
                transactions: () => ({
                    transactions: {},
                    phishing: {},
                    fetchStatusDetail: {},
                }),
                formDrafts: () => formDrafts,
                send: prepareSendFormReducer(extraDependenciesCommonMock),
                settings: () => ({ mevProtection: false }),
            }),
        }),
    });

const buildPrecomposedTransaction = (): PrecomposedTransactionFinal =>
    ({
        type: 'final',
        feeLimit: '52000',
        feePerByte: '20',
        fee: '1040000',
        totalSpent: '0',
        outputs: [],
        bytes: 0,
        inputs: [],
        outputsPermutation: [0],
    }) as PrecomposedTransactionFinal;

const buildEthStakeFormDraft = (): FormState =>
    ({
        outputs: [
            {
                address: POOL_ADDRESS,
                amount: '1.5',
                type: 'payment',
                token: null,
                fiat: '',
                currency: { label: '', value: '' },
            },
        ],
        options: ['transactionData'],
        transactionData: buildStakeData(),
        isCoinControlEnabled: false,
        hasCoinControlBeenOpened: false,
        selectedUtxos: [],
        selectedFee: 'normal',
        feePerUnit: '',
        feeLimit: '',
    }) as FormState;

const ethereumSignTransactionMock = TrezorConnect.ethereumSignTransaction as jest.Mock;
const pushTransactionMock = TrezorConnect.pushTransaction as jest.Mock;

const dispatchDispatcher = async (
    store: ReturnType<typeof buildStore>,
    args: Parameters<typeof signStakeTransactionNativeThunk>[0],
) => {
    const action = await store.dispatch(signStakeTransactionNativeThunk(args) as any);
    if (isFulfilled(action)) return { ok: true as const, txid: action.payload.txid };
    if (isRejected(action)) return { ok: false as const, error: action.payload };
    throw new Error('Unexpected dispatch outcome');
};

beforeEach(() => {
    ethereumSignTransactionMock.mockClear();
    pushTransactionMock.mockClear();
    ethereumSignTransactionMock.mockResolvedValue({
        success: true,
        payload: { serializedTx: '0xsignedtx' },
    });
    pushTransactionMock.mockResolvedValue({
        success: true,
        payload: { txid: '0xpushedtxid' },
    });
});

describe('signStakeTransactionNativeThunk', () => {
    it('routes ethereum accounts to the ethereum staking thunk', async () => {
        const store = buildStore({
            formDrafts: {
                [getFormDraftKey('stake', ETH_ACCOUNT_KEY)]: buildEthStakeFormDraft(),
            },
        });

        const result = await dispatchDispatcher(store, {
            accountKey: ETH_ACCOUNT_KEY,
            stakeType: 'stake',
            precomposedTransaction: buildPrecomposedTransaction(),
        });

        expect(result).toEqual({ ok: true, txid: '0xpushedtxid' });
        expect(ethereumSignTransactionMock).toHaveBeenCalledTimes(1);
    });

    it('rejects for unsupported networkType (solana — not yet implemented)', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const store = buildStore({ accounts: [solAccount] });

        const result = await dispatchDispatcher(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'stake',
            precomposedTransaction: buildPrecomposedTransaction(),
        });

        expect(result).toEqual({
            ok: false,
            error: {
                error: 'sign-transaction-failed',
                message: 'Staking is not supported for network type: solana',
            },
        });
        errorSpy.mockRestore();
    });

    it('rejects when the account is not found', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const store = buildStore({ accounts: [] });

        const result = await dispatchDispatcher(store, {
            accountKey: ETH_ACCOUNT_KEY,
            stakeType: 'stake',
            precomposedTransaction: buildPrecomposedTransaction(),
        });

        expect(result).toEqual({
            ok: false,
            error: { error: 'sign-transaction-failed', message: 'Account not found.' },
        });
        errorSpy.mockRestore();
    });
});
