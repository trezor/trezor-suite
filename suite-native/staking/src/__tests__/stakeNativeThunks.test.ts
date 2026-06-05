import { combineReducers, isFulfilled, isRejected } from '@reduxjs/toolkit';

import { messageSystemInitialState } from '@suite-common/message-system';
import { buildStakeData } from '@suite-common/staking';
import { type TrezorDevice } from '@suite-common/suite-types';
import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import { prepareSendFormReducer } from '@suite-common/wallet-core';
import {
    type Account,
    type FormState,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getFormDraftKey } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { type StaticSessionId } from '@trezor/device-utils';

import { signStakeTransactionNativeThunk } from '../stakeNativeThunks';

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

jest.mock('@trezor/coins-solana/runtime', () => ({
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
const ETH_ACCOUNT_KEY = mockAccountKey({
    symbol: 'eth',
    descriptor: 'eth1',
    deviceStaticSessionId: STATIC_SESSION_ID,
});
const SOL_ACCOUNT_KEY = mockAccountKey({
    symbol: 'sol',
    descriptor: 'sol1',
    deviceStaticSessionId: STATIC_SESSION_ID,
});
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
                blockchain: () => blockchain,
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

    it('routes solana accounts to the solana staking thunk', async () => {
        const store = buildStore({
            accounts: [solAccount],
            blockchain: { sol: { url: 'http://localhost:8899' } },
        });

        const result = await dispatchDispatcher(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'stake',
            precomposedTransaction: buildSolanaPrecomposedTransaction(),
        });

        expect(result).toEqual({ ok: true, txid: '0xpushedtxid' });
        expect(solanaSignTransactionMock).toHaveBeenCalledTimes(1);
        expect(ethereumSignTransactionMock).not.toHaveBeenCalled();
    });

    it('routes solana unstake to the solana staking thunk', async () => {
        const store = buildStore({
            accounts: [solAccount],
            blockchain: { sol: { url: 'http://localhost:8899' } },
        });

        const result = await dispatchDispatcher(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'unstake',
            precomposedTransaction: buildSolanaPrecomposedTransaction(),
        });

        expect(result).toEqual({ ok: true, txid: '0xpushedtxid' });
        expect(solanaSignTransactionMock).toHaveBeenCalledTimes(1);
        expect(ethereumSignTransactionMock).not.toHaveBeenCalled();
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
        const ada1Key = mockAccountKey({ symbol: 'ada', descriptor: 'ada1' });
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
