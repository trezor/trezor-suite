import { combineReducers, isFulfilled, isRejected } from '@reduxjs/toolkit';

import { createTestStore } from '@suite-common/test-utils';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

import { composeSolanaStakingTransactionFeeLevelsThunk } from './solanaStakingThunks';

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    ...jest.requireActual('@trezor/connect'),
    default: {
        blockchainGetInfo: jest.fn(),
        blockchainEstimateFee: jest.fn().mockResolvedValue({
            success: true,
            payload: { levels: [{ feePerUnit: '100000', feeLimit: '200000', feePerTx: '5000' }] },
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
    hasSplitInstruction: false,
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
    createTestStore({
        extra: undefined,
        reducer: combineReducers({
            wallet: combineReducers({
                accounts: () => accounts,
                blockchain: () => blockchain,
                fees: () => ({ sol: solanaFeeBucket, dsol: solanaFeeBucket }),
            }),
        }),
    });

const blockchainGetInfoMock = TrezorConnect.blockchainGetInfo as jest.Mock;
const blockchainEstimateFeeMock = TrezorConnect.blockchainEstimateFee as jest.Mock;

const dispatchCompose = async (
    store: ReturnType<typeof buildStore>,
    args: Parameters<typeof composeSolanaStakingTransactionFeeLevelsThunk>[0],
) => {
    const action = await store.dispatch(composeSolanaStakingTransactionFeeLevelsThunk(args) as any);
    if (isFulfilled(action)) return { ok: true as const, payload: action.payload };
    if (isRejected(action)) return { ok: false as const, error: action.payload };
    throw new Error('Unexpected dispatch outcome');
};

beforeEach(() => {
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

describe('composeSolanaStakingTransactionFeeLevelsThunk', () => {
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

    it('marks a transaction with a split instruction as device review only', async () => {
        // A split instruction cannot be recreated in Suite, the whole review happens on the device.
        prepareUnstakeSolTxMock.mockResolvedValue({
            success: true,
            txShim: solanaTxShim,
            solanaTxMeta: { ...solanaTxMetaMock, hasSplitInstruction: true },
        });
        const store = buildStore();

        const result = await dispatchCompose(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'unstake',
            amount: '1',
        });

        expect(result.ok).toBe(true);
        const levels = (result as { payload: Record<string, any> }).payload;
        expect(levels.normal.isDeviceReviewOnly).toBe(true);
    });

    it('keeps the device review only flag when the fee-aware preparation fails', async () => {
        // The fee-aware rebuild is only a refinement, losing it must not turn a split into a Suite review.
        prepareUnstakeSolTxMock.mockReset();
        prepareUnstakeSolTxMock.mockResolvedValueOnce({
            success: true,
            txShim: solanaTxShim,
            solanaTxMeta: { ...solanaTxMetaMock, hasSplitInstruction: true },
        });
        prepareUnstakeSolTxMock.mockResolvedValueOnce({ success: false });
        const store = buildStore();

        const result = await dispatchCompose(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'unstake',
            amount: '1',
        });

        expect(result.ok).toBe(true);
        const levels = (result as { payload: Record<string, any> }).payload;
        expect(levels.normal.isDeviceReviewOnly).toBe(true);
    });

    it('leaves a transaction without a split instruction reviewable in Suite', async () => {
        const store = buildStore();

        const result = await dispatchCompose(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'unstake',
            amount: '1',
        });

        expect(result.ok).toBe(true);
        const levels = (result as { payload: Record<string, any> }).payload;
        expect(levels.normal.isDeviceReviewOnly).toBe(false);
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

    it('rejects when the account is not found', async () => {
        const store = buildStore({ accounts: [] });

        const result = await dispatchCompose(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'stake',
            amount: '1',
        });

        expect(result).toEqual({
            ok: false,
            error: { error: 'sign-transaction-failed', message: 'Solana account not found.' },
        });
    });
});
