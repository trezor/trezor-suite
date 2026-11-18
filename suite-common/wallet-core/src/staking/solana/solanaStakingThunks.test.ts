import { combineReducers, isFulfilled, isRejected } from '@reduxjs/toolkit';

import { type AnalyticsSharedEvents } from '@suite-common/analytics';
import { type TestCompositionStore, createTestCompositionRoot } from '@suite-common/test-utils';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { mockGetTradedAccountKeys } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import { TrezorBlockchain } from '@trezor/blockchain-core';

import {
    type ComposeSolanaStakingTransactionFeeLevelsThunkDeps,
    composeSolanaStakingTransactionFeeLevelsThunk,
} from './solanaStakingThunks';
import { fetchAndUpdateAccountThunk } from '../../accounts/accountsThunks';

jest.mock('../../accounts/accountsThunks', () => ({ fetchAndUpdateAccountThunk: jest.fn() }));

jest.mock('@trezor/blockchain-core', () => ({
    TrezorBlockchain: {
        getInfo: jest.fn(),
        estimateFee: jest.fn().mockResolvedValue({
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
    lastValidBlockHeight: 1000,
};

const prepareStakeSolTxMock = jest.fn();
const prepareUnstakeSolTxMock = jest.fn();
const prepareClaimSolTxMock = jest.fn();
const fetchAndUpdateAccountThunkMock = fetchAndUpdateAccountThunk as unknown as jest.Mock;

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

// Fee-level cases use sparse Solana backend and fee fixtures instead of full wallet slices.
type State = {
    wallet: {
        accounts: Account[];
        blockchain: Partial<Record<'sol' | 'dsol', { url: string }>>;
        fees: Record<'sol' | 'dsol', typeof solanaFeeBucket>;
    };
};

type BuildStoreParams = {
    accounts?: Account[];
    blockchain?: Partial<Record<'sol' | 'dsol', { url: string }>>;
};

const buildStore = ({
    accounts = [solAccount],
    blockchain = {
        sol: { url: 'http://localhost:8899' },
        dsol: { url: 'http://localhost:8899' },
    },
}: BuildStoreParams = {}) =>
    createTestCompositionRoot<ComposeSolanaStakingTransactionFeeLevelsThunkDeps, State>({
        reducer: combineReducers({
            wallet: combineReducers({
                accounts: () => accounts,
                blockchain: () => blockchain,
                fees: () => ({ sol: solanaFeeBucket, dsol: solanaFeeBucket }),
            }),
        }),
        services: () => ({
            analytics: mockAnalytics<AnalyticsSharedEvents>(),
            getTradedAccountKeys: mockGetTradedAccountKeys(),
        }),
    }).services.store;

const blockchainGetInfoMock = TrezorBlockchain.getInfo as jest.Mock;
const blockchainEstimateFeeMock = TrezorBlockchain.estimateFee as jest.Mock;

const dispatchCompose = async (
    store: TestCompositionStore<State, ComposeSolanaStakingTransactionFeeLevelsThunkDeps>,
    args: Parameters<typeof composeSolanaStakingTransactionFeeLevelsThunk>[0],
) => {
    const action = await store.dispatch(composeSolanaStakingTransactionFeeLevelsThunk(args) as any);
    if (isFulfilled(action)) return { ok: true as const, payload: action.payload };
    if (isRejected(action)) return { ok: false as const, error: action.payload };
    throw new Error('Unexpected dispatch outcome');
};

beforeEach(() => {
    jest.mocked(fetchAndUpdateAccountThunk).mockClear();
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

    fetchAndUpdateAccountThunkMock.mockReset();
    fetchAndUpdateAccountThunkMock.mockImplementation(() => () => Promise.resolve());
});

describe('composeSolanaStakingTransactionFeeLevelsThunk', () => {
    it.each(['unstake', 'claim'] as const)(
        'classifies a failed %s estimate using only a proven protocol-fee shortfall',
        async stakeType => {
            const prepareTx =
                stakeType === 'claim' ? prepareClaimSolTxMock : prepareUnstakeSolTxMock;
            prepareTx.mockResolvedValue({
                success: true,
                txShim: solanaTxShim,
                solanaTxMeta: { ...solanaTxMetaMock, rentLamports: '0' },
            });
            for (const availableBalance of ['0', '4999', '5000', '100000000']) {
                blockchainEstimateFeeMock.mockResolvedValueOnce({
                    success: false,
                    payload: { error: 'simulation failed' },
                });
                const store = buildStore({ accounts: [{ ...solAccount, availableBalance }] });
                const result = await dispatchCompose(store, {
                    accountKey: SOL_ACCOUNT_KEY,
                    stakeType,
                    amount: '1',
                });
                expect(result).toEqual({
                    ok: true,
                    payload: {
                        normal: expect.objectContaining({
                            type: 'error',
                            error:
                                Number(availableBalance) < 5000
                                    ? 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE'
                                    : 'TR_GENERIC_ERROR_TITLE',
                        }),
                    },
                });
            }
        },
    );

    it.each([
        ['5000', 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE'],
        ['2287879', 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE'],
        ['2287880', 'TR_GENERIC_ERROR_TITLE'],
        ['2287881', 'TR_GENERIC_ERROR_TITLE'],
    ])(
        'uses the known rent when classifying a failed split unstake estimate: balance %s',
        async (availableBalance, error) => {
            prepareUnstakeSolTxMock.mockResolvedValue({
                success: true,
                txShim: solanaTxShim,
                solanaTxMeta: { ...solanaTxMetaMock, hasSplitInstruction: true },
            });
            blockchainEstimateFeeMock.mockResolvedValueOnce({
                success: false,
                payload: { error: 'simulation failed' },
            });
            const store = buildStore({ accounts: [{ ...solAccount, availableBalance }] });

            expect(
                await dispatchCompose(store, {
                    accountKey: SOL_ACCOUNT_KEY,
                    stakeType: 'unstake',
                    amount: '1',
                }),
            ).toEqual({
                ok: true,
                payload: { normal: expect.objectContaining({ type: 'error', error }) },
            });
        },
    );

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
        expect(levels.normal.fee).toBe('2287880');
        expect(levels.normal.solanaTxMeta.feeIncludingRentLamports).toBe('2287880');
    });

    it.each(['65001', '65002'])(
        'checks the encoded claim fee against %s lamports',
        async availableBalance => {
            blockchainEstimateFeeMock.mockResolvedValueOnce({
                success: true,
                payload: {
                    levels: [{ feePerUnit: '300000.25', feeLimit: '200003', feePerTx: '65001' }],
                },
            });
            prepareClaimSolTxMock.mockResolvedValue({
                success: true,
                txShim: solanaTxShim,
                solanaTxMeta: {
                    ...solanaTxMetaMock,
                    rentLamports: '0',
                    feeLamports: '65002',
                    feeIncludingRentLamports: '65002',
                },
            });

            const store = buildStore({ accounts: [{ ...solAccount, availableBalance }] });
            const result = await dispatchCompose(store, {
                accountKey: SOL_ACCOUNT_KEY,
                stakeType: 'claim',
                amount: '1',
            });

            expect(result).toEqual({
                ok: true,
                payload: {
                    normal: expect.objectContaining(
                        availableBalance === '65002'
                            ? { type: 'final', fee: '65002' }
                            : { type: 'error', error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' },
                    ),
                },
            });
        },
    );

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

    it('blocks signing when the fee-aware preparation fails', async () => {
        prepareUnstakeSolTxMock.mockReset();
        prepareUnstakeSolTxMock.mockResolvedValueOnce({
            success: true,
            txShim: solanaTxShim,
            solanaTxMeta: { ...solanaTxMetaMock, hasSplitInstruction: true },
        });
        prepareUnstakeSolTxMock.mockResolvedValueOnce({
            success: false,
            errorCode: 'UNKNOWN',
            errorMessage: 'RPC request failed',
        });
        const store = buildStore();

        const result = await dispatchCompose(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'unstake',
            amount: '1',
        });

        expect(result).toEqual({
            ok: true,
            payload: {
                normal: expect.objectContaining({
                    type: 'error',
                    error: 'TR_STAKE_TX_PREPARATION_FAILED',
                }),
            },
        });
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

    it('reports an unexpected preparation failure instead of an insufficient fee', async () => {
        prepareClaimSolTxMock.mockResolvedValue({
            success: false,
            errorCode: 'UNKNOWN',
            errorMessage: 'RPC request failed',
        });
        const store = buildStore();

        const result = await dispatchCompose(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'claim',
            amount: '1',
        });

        expect(result.ok).toBe(true);
        const levels = (result as { payload: Record<string, any> }).payload;
        expect(levels.normal).toEqual({
            type: 'error',
            error: 'TR_STAKE_TX_PREPARATION_FAILED',
            errorMessage: { id: 'TR_STAKE_TX_PREPARATION_FAILED' },
        });
        expect(blockchainEstimateFeeMock).not.toHaveBeenCalled();
        expect(fetchAndUpdateAccountThunk).not.toHaveBeenCalled();
    });

    it('reports an unstake above the active stake as a changed staked balance and refreshes the account', async () => {
        prepareUnstakeSolTxMock.mockResolvedValue({
            success: false,
            errorCode: 'INSUFFICIENT_ACTIVE_STAKE',
            errorMessage: 'Solana staking: unstaking failed - Active stake less than requested',
        });
        const store = buildStore();

        const result = await dispatchCompose(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'unstake',
            amount: '1',
        });

        expect(result.ok).toBe(true);
        const levels = (result as { payload: Record<string, any> }).payload;
        expect(levels.normal).toEqual({
            type: 'error',
            error: 'TR_STAKE_SOL_STAKED_BALANCE_CHANGED',
            errorMessage: { id: 'TR_STAKE_SOL_STAKED_BALANCE_CHANGED' },
        });
        expect(fetchAndUpdateAccountThunkMock).toHaveBeenCalledWith({
            accountKey: SOL_ACCOUNT_KEY,
            forceFullRefresh: true,
        });
    });

    it('does not refresh the account when the preparation fails for another reason', async () => {
        prepareUnstakeSolTxMock.mockResolvedValue({
            success: false,
            errorCode: 'UNKNOWN',
            errorMessage: 'Solana staking: unstaking failed - Failed to fetch delegations',
        });
        const store = buildStore();

        await dispatchCompose(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'unstake',
            amount: '1',
        });

        expect(fetchAndUpdateAccountThunkMock).not.toHaveBeenCalled();
    });

    it('reports an invalid fee estimate instead of continuing with the initial transaction', async () => {
        prepareClaimSolTxMock.mockResolvedValueOnce({
            success: true,
            txShim: solanaTxShim,
            solanaTxMeta: { ...solanaTxMetaMock, rentLamports: '0' },
        });
        prepareClaimSolTxMock.mockResolvedValueOnce({
            success: false,
            errorCode: 'INVALID_FEE',
            errorMessage: 'Invalid Solana staking fee estimate.',
        });
        const store = buildStore();

        const result = await dispatchCompose(store, {
            accountKey: SOL_ACCOUNT_KEY,
            stakeType: 'claim',
            amount: '1',
        });

        expect(result).toEqual({
            ok: true,
            payload: {
                normal: {
                    type: 'error',
                    error: 'TR_STAKE_SOL_FEE_ESTIMATE_INVALID',
                    errorMessage: { id: 'TR_STAKE_SOL_FEE_ESTIMATE_INVALID' },
                },
            },
        });
    });

    it.each([false, true])(
        'blocks a claim that is no longer available (fee-aware: %s)',
        async feeAware => {
            if (feeAware) {
                prepareClaimSolTxMock.mockResolvedValueOnce({
                    success: true,
                    txShim: solanaTxShim,
                    solanaTxMeta: { ...solanaTxMetaMock, rentLamports: '0' },
                });
            }
            prepareClaimSolTxMock.mockResolvedValueOnce({
                success: false,
                errorCode: 'NO_CLAIMABLE_STAKE',
                errorMessage: 'No stake is currently available to claim.',
            });

            const result = await dispatchCompose(buildStore(), {
                accountKey: SOL_ACCOUNT_KEY,
                stakeType: 'claim',
                amount: '1',
            });

            expect(result).toEqual({
                ok: true,
                payload: {
                    normal: {
                        type: 'error',
                        error: 'TR_STAKE_SOL_NOTHING_TO_CLAIM',
                        errorMessage: { id: 'TR_STAKE_SOL_NOTHING_TO_CLAIM' },
                    },
                },
            });
            expect(fetchAndUpdateAccountThunk).toHaveBeenCalledTimes(1);
            expect(fetchAndUpdateAccountThunk).toHaveBeenCalledWith({
                accountKey: SOL_ACCOUNT_KEY,
                forceFullRefresh: true,
            });
        },
    );
});
