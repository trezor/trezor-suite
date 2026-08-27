import { combineReducers, isFulfilled, isRejected } from '@reduxjs/toolkit';

import { messageSystemInitialState } from '@suite-common/message-system';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { type TrezorDevice } from '@suite-common/suite-types';
import { configureMockStore } from '@suite-common/test-utils';
import { prepareSendFormReducer } from '@suite-common/wallet-core';
import {
    type Account,
    type AccountKey,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

import {
    composeSolanaStakingTransactionFeeLevelsNativeThunk,
    signSolanaStakingTransactionNativeThunk,
} from './stakeFormSolanaNativeThunks';

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    ...jest.requireActual('@trezor/connect'),
    default: {
        solanaSignTransaction: jest.fn(),
        blockchainGetInfo: jest.fn(),
        blockchainEstimateFee: jest.fn().mockResolvedValue({
            success: true,
            payload: { levels: [{ feePerUnit: '100000', feeLimit: '200000', feePerTx: '5000' }] },
        }),
        pushTransaction: jest.fn().mockResolvedValue({
            success: true,
            payload: { txid: 'solanaTxId' },
        }),
    },
}));

const solanaTxShim = {
    serializeMessage: jest.fn().mockReturnValue('solanaMessage'),
    serialize: jest.fn().mockReturnValue('0xsolanasignedtx'),
    addSignature: jest.fn(),
};

const solanaTxMetaMock = {
    deviceAmountLamports: '1000000000',
    feeLamports: '5000',
    rentLamports: '2282880',
    feeIncludingRentLamports: '2287880',
};

const prepareStakeSolTxMock = jest.fn();
const prepareUnstakeSolTxMock = jest.fn();
const prepareClaimSolTxMock = jest.fn();

jest.mock('@trezor/network-solana/runtime', () => ({
    __esModule: true,
    default: () =>
        Promise.resolve({
            selectSolanaConnection: jest.fn().mockReturnValue({}),
            selectSolanaValidator: jest.fn().mockReturnValue('validatorAddress'),
            prepareStakeSolTx: prepareStakeSolTxMock,
            prepareUnstakeSolTx: prepareUnstakeSolTxMock,
            prepareClaimSolTx: prepareClaimSolTxMock,
            address: (value: string) => value,
        }),
}));

jest.mock('@suite-native/device-mutex', () => ({
    requestPrioritizedDeviceAccess: async (callback: () => Promise<unknown>) => ({
        success: true,
        payload: await callback(),
    }),
}));

const STATIC_SESSION_ID = '1stTestnetAddress@device_id:0';
const SOL_ACCOUNT_KEY = 'sol1' as AccountKey;
const DSOL_ACCOUNT_KEY = 'dsol1' as AccountKey;

const solAccount: Account = {
    symbol: 'sol',
    networkType: 'solana',
    key: SOL_ACCOUNT_KEY,
    deviceState: STATIC_SESSION_ID,
    descriptor: 'SoLDeScRiPtoR1111111111111111111111111111111',
    path: "m/44'/501'/0'/0'",
    availableBalance: '10000000000',
    visible: true,
} as unknown as Account;

const dsolAccount: Account = {
    ...solAccount,
    symbol: 'dsol',
    key: DSOL_ACCOUNT_KEY,
} as unknown as Account;

const solanaFeeBucket = {
    data: {
        blockHeight: 0,
        minFee: 1,
        maxFee: 100,
        dustLimit: 0,
        levels: [{ label: 'normal', feePerUnit: '5000', blocks: -1, feeLimit: '200000' }],
    },
};

const buildStore = ({
    accounts = [solAccount],
    blockchain = {
        sol: { url: 'http://localhost:8899' },
        dsol: { url: 'http://localhost:8899' },
    },
}: {
    accounts?: Account[];
    blockchain?: Partial<Record<'sol' | 'dsol', { url: string }>>;
} = {}) =>
    configureMockStore({
        extra: undefined,
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
                transactions: () => ({ transactions: {}, phishing: {}, fetchStatusDetail: {} }),
                formDrafts: () => ({}),
                blockchain: () => blockchain,
                fees: () => ({ sol: solanaFeeBucket, dsol: solanaFeeBucket }),
                send: prepareSendFormReducer({
                    actionTypes: { storageLoad: mockActionType('storageLoad') },
                    reducers: { storageLoadFormDrafts: mockReducer() },
                }),
                settings: () => ({ mevProtection: false }),
            }),
        }),
    });

const buildSolanaPrecomposedTransaction = (): PrecomposedTransactionFinal =>
    ({
        type: 'final',
        feeLimit: '200000',
        feePerByte: '100000',
        fee: '2287880',
        totalSpent: '1002287880',
        outputs: [{ address: solAccount.descriptor, amount: '1', script_type: 'PAYTOADDRESS' }],
        bytes: 0,
        inputs: [],
        outputsPermutation: [0],
    }) as unknown as PrecomposedTransactionFinal;

const solanaSignTransactionMock = TrezorConnect.solanaSignTransaction as jest.Mock;
const blockchainGetInfoMock = TrezorConnect.blockchainGetInfo as jest.Mock;
const blockchainEstimateFeeMock = TrezorConnect.blockchainEstimateFee as jest.Mock;

const dispatchCompose = async (
    store: ReturnType<typeof buildStore>,
    args: Parameters<typeof composeSolanaStakingTransactionFeeLevelsNativeThunk>[0],
) => {
    const action = await store.dispatch(
        composeSolanaStakingTransactionFeeLevelsNativeThunk(args) as any,
    );
    if (isFulfilled(action)) return { ok: true as const, payload: action.payload };
    if (isRejected(action)) return { ok: false as const, error: action.payload };
    throw new Error('Unexpected dispatch outcome');
};

const dispatchSign = async (
    store: ReturnType<typeof buildStore>,
    args: Parameters<typeof signSolanaStakingTransactionNativeThunk>[0],
) => {
    const action = await store.dispatch(signSolanaStakingTransactionNativeThunk(args) as any);
    if (isFulfilled(action)) return { ok: true as const };
    if (isRejected(action)) return { ok: false as const, error: action.payload };
    throw new Error('Unexpected dispatch outcome');
};

beforeEach(() => {
    solanaSignTransactionMock.mockReset();
    solanaSignTransactionMock.mockResolvedValue({
        success: true,
        payload: { signature: 'ed25519signature' },
    });
    solanaTxShim.addSignature.mockClear();

    blockchainGetInfoMock.mockReset();
    blockchainGetInfoMock.mockResolvedValue({
        success: false,
        payload: { error: 'backend not connected' },
    });

    blockchainEstimateFeeMock.mockClear();

    prepareStakeSolTxMock.mockReset();
    prepareStakeSolTxMock.mockResolvedValue({
        success: true,
        txShim: solanaTxShim,
        solanaTxMeta: solanaTxMetaMock,
    });
    prepareUnstakeSolTxMock.mockReset();
    prepareUnstakeSolTxMock.mockResolvedValue({
        success: true,
        txShim: solanaTxShim,
        solanaTxMeta: solanaTxMetaMock,
    });
    prepareClaimSolTxMock.mockReset();
    prepareClaimSolTxMock.mockResolvedValue({
        success: true,
        txShim: solanaTxShim,
        solanaTxMeta: solanaTxMetaMock,
    });
});

describe('composeSolanaStakingTransactionFeeLevelsNativeThunk', () => {
    it('returns undefined for an empty amount', async () => {
        const store = buildStore();

        const result = await dispatchCompose(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'stake',
            amount: '',
        });

        expect(result).toEqual({ ok: true, payload: undefined });
    });

    it('composes a dsol (devnet) solana account the same way as sol', async () => {
        const store = buildStore({ accounts: [dsolAccount] });

        const result = await dispatchCompose(store, {
            accountKey: DSOL_ACCOUNT_KEY,
            stakeType: 'stake',
            amount: '1',
        });

        expect(result.ok).toBe(true);
        const levels = (result as { payload: Record<string, any> }).payload;
        expect(levels.normal.type).toBe('final');
        expect(levels.normal.solanaTxMeta.feeIncludingRentLamports).toBe('2287880');
    });

    it('composes an unstake the same way as stake', async () => {
        const store = buildStore();

        const result = await dispatchCompose(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'unstake',
            amount: '1',
        });

        expect(result.ok).toBe(true);
        const levels = (result as { payload: Record<string, any> }).payload;
        expect(levels.normal.type).toBe('final');
        expect(levels.normal.solanaTxMeta.feeIncludingRentLamports).toBe('2287880');
    });

    it('composes a claim through prepareClaimSolTx (not the stake builder)', async () => {
        const store = buildStore();

        const result = await dispatchCompose(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'claim',
            amount: '1',
        });

        expect(result.ok).toBe(true);
        const levels = (result as { payload: Record<string, any> }).payload;
        expect(levels.normal.type).toBe('final');
        expect(prepareClaimSolTxMock).toHaveBeenCalled();
        expect(prepareStakeSolTxMock).not.toHaveBeenCalled();
    });

    it('returns precomposed fee levels with the solana tx meta applied', async () => {
        const store = buildStore();

        const result = await dispatchCompose(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'stake',
            amount: '1',
        });

        expect(result.ok).toBe(true);
        const levels = (result as { payload: Record<string, any> }).payload;
        expect(levels.normal.type).toBe('final');
        // applySolanaTxMeta overrides the fee with feeIncludingRentLamports
        expect(levels.normal.fee).toBe('2287880');
        expect(levels.normal.solanaTxMeta.feeIncludingRentLamports).toBe('2287880');
    });

    it('omits newAccountProgramName when an unstake only deactivates (creates no stake account)', async () => {
        // A plain deactivate reserves no rent, so the fee estimate must not add a phantom rent reserve.
        prepareUnstakeSolTxMock.mockResolvedValue({
            success: true,
            txShim: solanaTxShim,
            solanaTxMeta: { ...solanaTxMetaMock, rentLamports: '0' },
        });
        const store = buildStore();

        await dispatchCompose(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'unstake',
            amount: '1',
        });

        expect(blockchainEstimateFeeMock).toHaveBeenCalled();
        const request = blockchainEstimateFeeMock.mock.calls.at(-1)?.[0];
        expect(request.request.specific).not.toHaveProperty('newAccountProgramName');
    });

    it('passes newAccountProgramName when an unstake splits a stake account (reserves rent)', async () => {
        // A split creates a new rent-exempt stake account, so that reserve must be counted.
        prepareUnstakeSolTxMock.mockResolvedValue({
            success: true,
            txShim: solanaTxShim,
            solanaTxMeta: { ...solanaTxMetaMock, rentLamports: '2282880' },
        });
        const store = buildStore();

        await dispatchCompose(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'unstake',
            amount: '1',
        });

        const request = blockchainEstimateFeeMock.mock.calls.at(-1)?.[0];
        expect(request.request.specific.newAccountProgramName).toBe('staking');
    });
});

describe('signSolanaStakingTransactionNativeThunk', () => {
    it('rejects when the account is not found', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const store = buildStore({ accounts: [] });

        const result = await dispatchSign(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'stake',
            precomposedTransaction: buildSolanaPrecomposedTransaction(),
        });

        expect(result).toEqual({
            ok: false,
            error: { error: 'sign-transaction-failed', message: 'Solana account not found.' },
        });
        errorSpy.mockRestore();
    });

    it('signs and stores the transaction without broadcasting', async () => {
        const store = buildStore();

        const result = await dispatchSign(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'stake',
            precomposedTransaction: buildSolanaPrecomposedTransaction(),
        });

        expect(result).toEqual({ ok: true });
        expect(solanaSignTransactionMock).toHaveBeenCalledTimes(1);
        expect(solanaTxShim.addSignature).toHaveBeenCalledWith(
            solAccount.descriptor,
            'ed25519signature',
        );
    });

    it('stamps createdTimestamp on the stored precomposed transaction (powers the validity timer)', async () => {
        const store = buildStore();

        const result = await dispatchSign(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'stake',
            precomposedTransaction: buildSolanaPrecomposedTransaction(),
        });

        expect(result).toEqual({ ok: true });
        expect(store.getState().wallet.send.precomposedTx?.createdTimestamp).toEqual(
            expect.any(Number),
        );
    });

    it('rejects when the blockchain backend URL cannot be resolved', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const store = buildStore({ blockchain: { dsol: { url: 'http://localhost:8899' } } });

        const result = await dispatchSign(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'stake',
            precomposedTransaction: buildSolanaPrecomposedTransaction(),
        });

        expect(result).toEqual({
            ok: false,
            error: {
                error: 'sign-transaction-failed',
                message: 'Blockchain backend URL not found for sol.',
            },
        });
        expect(blockchainGetInfoMock).toHaveBeenCalledWith({ coin: 'sol' });
        expect(solanaSignTransactionMock).not.toHaveBeenCalled();
        errorSpy.mockRestore();
    });

    it('falls back to an on-demand backend connection when the redux url is missing', async () => {
        blockchainGetInfoMock.mockResolvedValue({
            success: true,
            payload: { url: 'http://localhost:8899' },
        });
        const store = buildStore({ blockchain: { dsol: { url: 'http://localhost:8899' } } });

        const result = await dispatchSign(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'unstake',
            precomposedTransaction: buildSolanaPrecomposedTransaction(),
        });

        expect(result).toEqual({ ok: true });
        expect(blockchainGetInfoMock).toHaveBeenCalledWith({ coin: 'sol' });
        expect(prepareUnstakeSolTxMock).toHaveBeenCalledTimes(1);
        expect(solanaSignTransactionMock).toHaveBeenCalledTimes(1);
    });

    it('rejects (without logging) when the user cancels on the device', async () => {
        solanaSignTransactionMock.mockResolvedValue({
            success: false,
            error: { code: 'Method_Cancel', message: 'tx-cancelled' },
        });
        const store = buildStore();

        const result = await dispatchSign(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'stake',
            precomposedTransaction: buildSolanaPrecomposedTransaction(),
        });

        expect(result.ok).toBe(false);
        expect((result as { error: { message: string } }).error.message).toBe('tx-cancelled');
    });

    it('rejects with sign-transaction-timeout when the validity timer cancels the sign', async () => {
        solanaSignTransactionMock.mockResolvedValue({
            success: false,
            error: { code: 'Method_Cancel', message: 'tx-timeout' },
        });
        const store = buildStore();

        const result = await dispatchSign(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'stake',
            precomposedTransaction: buildSolanaPrecomposedTransaction(),
        });

        expect(result).toEqual({
            ok: false,
            error: {
                error: 'sign-transaction-timeout',
                errorCode: 'Method_Cancel',
                message: 'tx-timeout',
            },
        });
    });

    it('signs a solana unstake, forwarding the composed amount', async () => {
        const store = buildStore();

        const result = await dispatchSign(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'unstake',
            precomposedTransaction: buildSolanaPrecomposedTransaction(),
        });

        expect(result).toEqual({ ok: true });
        // Unstake must route through prepareUnstakeSolTx with a non-zero amount.
        expect(prepareUnstakeSolTxMock).toHaveBeenCalledTimes(1);
        expect(prepareUnstakeSolTxMock.mock.calls[0][0].amount).not.toBe('0');
        expect(prepareStakeSolTxMock).not.toHaveBeenCalled();
        expect(prepareClaimSolTxMock).not.toHaveBeenCalled();
    });

    it('signs and serializes a solana claim transaction', async () => {
        const store = buildStore();

        const result = await dispatchSign(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'claim',
            precomposedTransaction: buildSolanaPrecomposedTransaction(),
        });

        expect(result).toEqual({ ok: true });
        // Claim must route through prepareClaimSolTx, never the stake builder.
        expect(prepareClaimSolTxMock).toHaveBeenCalledTimes(1);
        expect(prepareStakeSolTxMock).not.toHaveBeenCalled();
        expect(solanaSignTransactionMock).toHaveBeenCalledTimes(1);
        expect(solanaTxShim.addSignature).toHaveBeenCalledWith(
            solAccount.descriptor,
            'ed25519signature',
        );
    });

    it('rejects a stake whose composed amount is zero', async () => {
        // A zero amount would sign a stake that moves nothing, so it must be rejected upfront
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const store = buildStore();
        const precomposedTransaction = {
            ...buildSolanaPrecomposedTransaction(),
            outputs: [{ address: solAccount.descriptor, amount: '0', script_type: 'PAYTOADDRESS' }],
        } as unknown as PrecomposedTransactionFinal;

        const result = await dispatchSign(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'stake',
            precomposedTransaction,
        });

        expect(result).toEqual({
            ok: false,
            error: {
                error: 'sign-transaction-failed',
                message: 'Compose result for stake is missing the amount.',
            },
        });
        expect(prepareStakeSolTxMock).not.toHaveBeenCalled();
        errorSpy.mockRestore();
    });

    it('signs a claim and ignores the composed amount', async () => {
        const store = buildStore();
        const precomposedTransaction = {
            ...buildSolanaPrecomposedTransaction(),
            outputs: [{ address: solAccount.descriptor, amount: '0', script_type: 'PAYTOADDRESS' }],
        } as unknown as PrecomposedTransactionFinal;

        const result = await dispatchSign(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'claim',
            precomposedTransaction,
        });

        expect(result).toEqual({ ok: true });
        expect(prepareClaimSolTxMock).toHaveBeenCalledTimes(1);
        expect(prepareClaimSolTxMock.mock.calls[0][0]).not.toHaveProperty('amount');
    });
});
