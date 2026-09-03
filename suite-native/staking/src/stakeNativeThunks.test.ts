import { combineReducers, isFulfilled, isRejected } from '@reduxjs/toolkit';

import { messageSystemInitialState } from '@suite-common/message-system';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { WALLET_SDK_SOURCE_MOBILE, buildStakeData } from '@suite-common/staking';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockGetIsWindowVisible, mockOnModalCancel } from '@suite-common/suite-types/mocks';
import { createTestStore } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { prepareSendFormReducer } from '@suite-common/wallet-core';
import {
    type Account,
    type FormState,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { mockAccountKey, mockGetTradedAccountKeys } from '@suite-common/wallet-types/mocks';
import { getFormDraftKey } from '@suite-common/wallet-utils';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import TrezorConnect from '@trezor/connect';
import { type StaticSessionId } from '@trezor/device-utils';

import {
    type PushStakeTransactionNativeThunkDeps,
    pushStakeTransactionNativeThunk,
    signStakeTransactionNativeThunk,
} from './stakeNativeThunks';

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    ...jest.requireActual('@trezor/connect'),
    default: {
        ethereumSignTransaction: jest.fn().mockResolvedValue({
            success: true,
            payload: { serializedTx: '0xsignedtx' },
        }),
        solanaSignTransaction: jest.fn().mockResolvedValue({
            success: true,
            payload: { signature: 'ed25519signature' },
        }),
        blockchainGetInfo: jest.fn().mockResolvedValue({
            success: true,
            payload: { url: 'http://localhost:8899' },
        }),
        blockchainEstimateFee: jest.fn().mockResolvedValue({
            success: true,
            payload: { levels: [{ feePerUnit: '100000', feeLimit: '200000', feePerTx: '5000' }] },
        }),
        pushTransaction: jest.fn().mockResolvedValue({
            success: true,
            payload: { txid: '0xpushedtxid' },
        }),
    },
}));

const solanaTxShim = {
    serializeMessage: jest.fn().mockReturnValue('solanaMessage'),
    serialize: jest.fn().mockReturnValue('0xsolanasignedtx'),
    addSignature: jest.fn(),
};

jest.mock('@trezor/network-solana/runtime', () => ({
    __esModule: true,
    default: () =>
        Promise.resolve({
            selectSolanaConnection: jest.fn().mockReturnValue({}),
            selectSolanaValidator: jest.fn().mockReturnValue('validatorAddress'),
            prepareStakeSolTx: jest.fn().mockResolvedValue({
                success: true,
                txShim: solanaTxShim,
                solanaTxMeta: {
                    deviceAmountLamports: '1000000000',
                    feeLamports: '5000',
                    rentLamports: '2282880',
                    feeIncludingRentLamports: '2287880',
                },
            }),
            prepareUnstakeSolTx: jest.fn().mockResolvedValue({
                success: true,
                txShim: solanaTxShim,
                solanaTxMeta: {
                    deviceAmountLamports: '1000000000',
                    feeLamports: '5000',
                    rentLamports: '2282880',
                    feeIncludingRentLamports: '2287880',
                },
            }),
            address: (value: string) => value,
        }),
}));

jest.mock('@suite-native/device-mutex', () => ({
    requestPrioritizedDeviceAccess: async (callback: () => Promise<unknown>) => ({
        success: true,
        payload: await callback(),
    }),
}));

const STATIC_SESSION_ID: StaticSessionId = '1stTestnetAddress@device_id:0';
const ethSymbol = asNetworkSymbol('eth');
const solSymbol = asNetworkSymbol('sol');
const adaSymbol = asNetworkSymbol('ada');
const ETH_ACCOUNT_KEY = mockAccountKey({
    symbol: ethSymbol,
    descriptor: 'eth1',
    deviceStaticSessionId: STATIC_SESSION_ID,
});
const SOL_ACCOUNT_KEY = mockAccountKey({
    symbol: solSymbol,
    descriptor: 'sol1',
    deviceStaticSessionId: STATIC_SESSION_ID,
});
const POOL_ADDRESS = '0xD523794C879D9eC028960a231F866758e405bE34';
const extra: PushStakeTransactionNativeThunkDeps = {
    actions: { onModalCancel: mockOnModalCancel() },
    services: {
        analytics: mockNativeAnalytics(),
        getIsWindowVisible: mockGetIsWindowVisible(),
        getTradedAccountKeys: mockGetTradedAccountKeys(),
    },
};

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
    descriptor: 'SoLDeScRiPtoR1111111111111111111111111111111',
    path: "m/44'/501'/0'/0'",
    visible: true,
} as unknown as Account;

const buildStore = ({
    accounts = [ethAccount],
    formDrafts = {},
    blockchain = {},
}: {
    accounts?: Account[];
    formDrafts?: Record<string, FormState>;
    blockchain?: Record<string, unknown>;
} = {}) =>
    createTestStore({
        extra,
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
                blockchain: () => blockchain,
                send: prepareSendFormReducer({
                    actionTypes: { storageLoad: mockActionType('storageLoad') },
                    reducers: { storageLoadFormDrafts: mockReducer() },
                }),
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
        transactionData: buildStakeData(WALLET_SDK_SOURCE_MOBILE),
        isCoinControlEnabled: false,
        hasCoinControlBeenOpened: false,
        selectedUtxos: [],
        selectedFee: 'normal',
        feePerUnit: '',
        feeLimit: '',
    }) as FormState;

const buildSolanaPrecomposedTransaction = (): PrecomposedTransactionFinal =>
    ({
        type: 'final',
        feeLimit: '200000',
        feePerByte: '100000',
        fee: '2287880',
        totalSpent: '1002287880',
        outputs: [
            {
                address: solAccount.descriptor,
                amount: '1',
                script_type: 'PAYTOADDRESS',
            },
        ],
        bytes: 0,
        inputs: [],
        outputsPermutation: [0],
    }) as unknown as PrecomposedTransactionFinal;

const ethereumSignTransactionMock = TrezorConnect.ethereumSignTransaction as jest.Mock;
const solanaSignTransactionMock = TrezorConnect.solanaSignTransaction as jest.Mock;
const pushTransactionMock = TrezorConnect.pushTransaction as jest.Mock;

const dispatchDispatcher = async (
    store: ReturnType<typeof buildStore>,
    args: Parameters<typeof signStakeTransactionNativeThunk>[0],
) => {
    const action = await store.dispatch(signStakeTransactionNativeThunk(args) as any);
    if (isFulfilled(action)) return { ok: true as const };
    if (isRejected(action)) return { ok: false as const, error: action.payload };
    throw new Error('Unexpected dispatch outcome');
};

const dispatchPush = async (
    store: ReturnType<typeof buildStore>,
    args: Parameters<typeof pushStakeTransactionNativeThunk>[0],
) => {
    const action = await store.dispatch(pushStakeTransactionNativeThunk(args) as any);
    if (isFulfilled(action)) return { ok: true as const, txid: action.payload.txid };
    if (isRejected(action)) return { ok: false as const, error: action.payload };
    throw new Error('Unexpected dispatch outcome');
};

beforeEach(() => {
    ethereumSignTransactionMock.mockClear();
    solanaSignTransactionMock.mockClear();
    solanaTxShim.addSignature.mockClear();
    pushTransactionMock.mockClear();
    ethereumSignTransactionMock.mockResolvedValue({
        success: true,
        payload: { serializedTx: '0xsignedtx' },
    });
    solanaSignTransactionMock.mockResolvedValue({
        success: true,
        payload: { signature: 'ed25519signature' },
    });
    pushTransactionMock.mockResolvedValue({
        success: true,
        payload: { txid: '0xpushedtxid' },
    });
});

describe('signStakeTransactionNativeThunk', () => {
    it('routes ethereum accounts to the ethereum staking thunk and signs without broadcasting', async () => {
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

        expect(result).toEqual({ ok: true });
        expect(ethereumSignTransactionMock).toHaveBeenCalledTimes(1);
        expect(pushTransactionMock).not.toHaveBeenCalled();
    });

    it('routes solana accounts to the solana staking thunk and signs without broadcasting', async () => {
        const store = buildStore({
            accounts: [solAccount],
            blockchain: { sol: { url: 'http://localhost:8899' } },
        });

        const result = await dispatchDispatcher(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'stake',
            precomposedTransaction: buildSolanaPrecomposedTransaction(),
        });

        expect(result).toEqual({ ok: true });
        expect(solanaSignTransactionMock).toHaveBeenCalledTimes(1);
        expect(ethereumSignTransactionMock).not.toHaveBeenCalled();
        expect(pushTransactionMock).not.toHaveBeenCalled();
    });

    it('routes solana unstake to the solana staking thunk and signs without broadcasting', async () => {
        const store = buildStore({
            accounts: [solAccount],
            blockchain: { sol: { url: 'http://localhost:8899' } },
        });

        const result = await dispatchDispatcher(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'unstake',
            precomposedTransaction: buildSolanaPrecomposedTransaction(),
        });

        expect(result).toEqual({ ok: true });
        expect(solanaSignTransactionMock).toHaveBeenCalledTimes(1);
        expect(ethereumSignTransactionMock).not.toHaveBeenCalled();
        expect(pushTransactionMock).not.toHaveBeenCalled();
    });

    it('rejects solana claim (out of scope on mobile)', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const store = buildStore({
            accounts: [solAccount],
            blockchain: { sol: { url: 'http://localhost:8899' } },
        });

        const result = await dispatchDispatcher(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'claim',
            precomposedTransaction: buildSolanaPrecomposedTransaction(),
        });

        expect(result.ok).toBe(false);
        expect(solanaSignTransactionMock).not.toHaveBeenCalled();
        expect(ethereumSignTransactionMock).not.toHaveBeenCalled();
        errorSpy.mockRestore();
    });

    it('rejects for unsupported networkType (cardano)', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const ada1Key = mockAccountKey({ symbol: adaSymbol, descriptor: 'ada1' });
        const cardanoAccount = {
            ...solAccount,
            symbol: 'ada',
            networkType: 'cardano',
            key: ada1Key,
        } as unknown as Account;
        const store = buildStore({ accounts: [cardanoAccount] });

        const result = await dispatchDispatcher(store, {
            accountKey: ada1Key,
            stakeType: 'stake',
            precomposedTransaction: buildPrecomposedTransaction(),
        });

        expect(result).toEqual({
            ok: false,
            error: {
                error: 'sign-transaction-failed',
                message: 'Staking is not supported for network type: cardano',
            },
        });
        expect(solanaSignTransactionMock).not.toHaveBeenCalled();
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

describe('pushStakeTransactionNativeThunk', () => {
    it('broadcasts the transaction signed during a deferred sign', async () => {
        const store = buildStore({
            formDrafts: {
                [getFormDraftKey('stake', ETH_ACCOUNT_KEY)]: buildEthStakeFormDraft(),
            },
        });

        // Sign without broadcasting so the signed transaction is stored in the send slice.
        await dispatchDispatcher(store, {
            accountKey: ETH_ACCOUNT_KEY,
            stakeType: 'stake',
            precomposedTransaction: buildPrecomposedTransaction(),
        });
        expect(pushTransactionMock).not.toHaveBeenCalled();

        const result = await dispatchPush(store, { accountKey: ETH_ACCOUNT_KEY });

        expect(result).toEqual({ ok: true, txid: '0xpushedtxid' });
        expect(pushTransactionMock).toHaveBeenCalledTimes(1);
    });

    it('broadcasts a solana transaction signed during a deferred sign', async () => {
        const store = buildStore({
            accounts: [solAccount],
            blockchain: { sol: { url: 'http://localhost:8899' } },
        });

        // Sign without broadcasting so the signed solana transaction is stored.
        await dispatchDispatcher(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'stake',
            precomposedTransaction: buildSolanaPrecomposedTransaction(),
        });
        expect(pushTransactionMock).not.toHaveBeenCalled();

        const result = await dispatchPush(store, { accountKey: SOL_ACCOUNT_KEY });

        expect(result).toEqual({ ok: true, txid: '0xpushedtxid' });
        expect(pushTransactionMock).toHaveBeenCalledTimes(1);
    });

    it('rejects when the account is not found', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const store = buildStore({ accounts: [] });

        const result = await dispatchPush(store, { accountKey: ETH_ACCOUNT_KEY });

        expect(result).toEqual({
            ok: false,
            error: { error: 'sign-transaction-failed', message: 'Account not found.' },
        });
        expect(pushTransactionMock).not.toHaveBeenCalled();
        errorSpy.mockRestore();
    });

    it('rejects with push-transaction-pending-conflict when the broadcast hits a replacement', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        pushTransactionMock.mockResolvedValue({
            success: false,
            error: { message: 'could not replace existing tx' },
        });
        const store = buildStore({
            formDrafts: {
                [getFormDraftKey('stake', ETH_ACCOUNT_KEY)]: buildEthStakeFormDraft(),
            },
        });

        // Sign without broadcasting so the signed transaction is stored before the push.
        await dispatchDispatcher(store, {
            accountKey: ETH_ACCOUNT_KEY,
            stakeType: 'stake',
            precomposedTransaction: buildPrecomposedTransaction(),
        });

        const result = await dispatchPush(store, { accountKey: ETH_ACCOUNT_KEY });

        expect(result).toMatchObject({
            ok: false,
            error: {
                error: 'push-transaction-pending-conflict',
                metadata: { error: { message: 'could not replace existing tx' } },
            },
        });
        errorSpy.mockRestore();
    });
});
