import { combineReducers, isFulfilled, isRejected } from '@reduxjs/toolkit';

import { type AnalyticsSharedEvents } from '@suite-common/analytics';
import { mockGetAccountSyncInterval } from '@suite-common/networks/mocks';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockGetIsWindowVisible } from '@suite-common/suite-types/mocks';
import { type TestCompositionStore, createTestCompositionRoot } from '@suite-common/test-utils';
import {
    createNotificationsReducer,
    notificationsActions,
} from '@suite-common/toast-notifications';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type GeneralPrecomposedTransactionFinal,
    type StakeType,
    asAccountDescriptor,
} from '@suite-common/wallet-types';
import { mockGetTradedAccountKeys, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import TrezorConnect from '@trezor/connect';

import { stakeActions } from './stakingActions';
import {
    type PushStakeTransactionThunkDeps,
    pushStakeTransactionThunk,
} from './stakingTransactionThunks';
import { earnTransactionsReducer } from '../earn/earnTransactionsReducer';
import {
    addFakePendingCardanoTxThunk,
    addFakePendingEvmTxThunk,
} from '../transactions/transactionsThunks';

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    ...jest.requireActual('@trezor/connect'),
    default: {
        pushTransaction: jest.fn(),
        blockchainGetTransactions: jest.fn().mockResolvedValue({ success: true, payload: [] }),
    },
}));

const ethAccount = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    descriptor: asAccountDescriptor('0xfffffffffffffffffffffffffffffffffffffffe'),
});
const adaAccount = mockWalletAccount({ symbol: asNetworkSymbol('ada') });

const selectedDevice = {
    path: 'device-id:1',
    instance: 1,
    state: { sessionId: '1', staticSessionId: ethAccount.deviceState },
    useEmptyPassphrase: true,
} as unknown as TrezorDevice;

const { reducer: notificationsReducer } = createNotificationsReducer();

type State = {
    device: { selectedDevice: TrezorDevice };
    notifications: ReturnType<typeof notificationsReducer>;
    wallet: {
        accounts: Account[];
        earnTransactions: ReturnType<typeof earnTransactionsReducer>;
        transactions: {
            transactions: Record<never, never>;
            phishing: Record<never, never>;
            fetchStatusDetail: Record<never, never>;
        };
        blockchain: Record<never, never>;
        fees: Record<never, never>;
        send: Record<never, never>;
        stake: { resolvedEthereumNonce?: string };
        settings: { mevProtection: boolean };
    };
};

const buildStore = ({ mevProtection = false }: { mevProtection?: boolean } = {}) =>
    createTestCompositionRoot<PushStakeTransactionThunkDeps, State>({
        reducer: combineReducers({
            device: () => ({ selectedDevice }),
            notifications: notificationsReducer,
            wallet: combineReducers({
                accounts: () => [ethAccount, adaAccount],
                earnTransactions: earnTransactionsReducer,
                transactions: () => ({ transactions: {}, phishing: {}, fetchStatusDetail: {} }),
                blockchain: () => ({}),
                fees: () => ({}),
                send: () => ({}),
                stake: (): State['wallet']['stake'] => ({ resolvedEthereumNonce: '7' }),
                settings: () => ({ mevProtection }),
            }),
        }),
        services: () => ({
            analytics: mockAnalytics<AnalyticsSharedEvents>(),
            networks: { getAccountSyncInterval: mockGetAccountSyncInterval() },
            getIsWindowVisible: mockGetIsWindowVisible(),
            getTradedAccountKeys: mockGetTradedAccountKeys(),
        }),
    }).services;

const precomposedTransaction = {
    type: 'final',
    feeLimit: '52000',
    feePerByte: '20',
    fee: '1040000',
    totalSpent: '1000000000001040000',
    outputs: [],
    bytes: 0,
    inputs: [],
    outputsPermutation: [0],
} as GeneralPrecomposedTransactionFinal;

const pushTransactionMock = TrezorConnect.pushTransaction as jest.Mock;

type PushParams = {
    account?: Account;
    stakeType?: StakeType;
    isMevProtectionFeatureEnabled?: boolean;
};

const push = async (
    services: ReturnType<typeof buildStore>,
    {
        account = ethAccount,
        stakeType = 'stake',
        isMevProtectionFeatureEnabled = false,
    }: PushParams = {},
) => {
    const action = await services.store.dispatch(
        pushStakeTransactionThunk({
            accountKey: account.key,
            stakeType,
            serializedTx: { tx: '0xsignedtx', symbol: account.symbol },
            precomposedTransaction,
            isMevProtectionFeatureEnabled,
        }) as any,
    );

    if (isFulfilled(action)) return { ok: true as const, payload: action.payload };
    if (isRejected(action)) return { ok: false as const, error: action.payload };

    throw new Error('Unexpected dispatch outcome');
};

const getToastPayloads = (store: TestCompositionStore<State, PushStakeTransactionThunkDeps>) =>
    store
        .getActions()
        .filter(notificationsActions.addToast.match)
        .map(action => action.payload);

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    pushTransactionMock.mockResolvedValue({ success: true, payload: { txid: '0xpushedtxid' } });
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('pushStakeTransactionThunk', () => {
    it('broadcasts the signed transaction and returns its id', async () => {
        const services = buildStore();

        const result = await push(services);

        expect(result).toEqual({ ok: true, payload: { txid: '0xpushedtxid' } });
        expect(pushTransactionMock).toHaveBeenCalledWith({
            tx: { hex: '0xsignedtx', disableAlternativeRPC: true },
            coin: 'eth',
            identity: expect.any(String),
        });
    });

    it('shows the earn toast of the flow', async () => {
        const services = buildStore();

        await push(services, { stakeType: 'unstake' });

        expect(getToastPayloads(services.store)).toEqual([
            expect.objectContaining({
                type: 'tx-unstaked',
                stage: 'pending',
                txid: '0xpushedtxid',
                symbol: 'eth',
            }),
        ]);
    });

    it('adds the pending Ethereum transaction with the signed nonce', async () => {
        const services = buildStore();

        await push(services);

        const fakePendingAction = services.store
            .getActions()
            .find(addFakePendingEvmTxThunk.pending.match);
        expect(fakePendingAction?.meta.arg).toMatchObject({
            txid: '0xpushedtxid',
            ethereumNonce: '7',
            account: ethAccount,
        });
    });

    it('applies MEV protection only when the feature and the setting allow it', async () => {
        await push(buildStore({ mevProtection: true }), { isMevProtectionFeatureEnabled: true });
        await push(buildStore({ mevProtection: true }), { isMevProtectionFeatureEnabled: false });

        const [protectedCall, plainCall] = pushTransactionMock.mock.calls;
        expect(protectedCall[0].tx).toBe('0xsignedtx');
        expect(plainCall[0].tx).toEqual({ hex: '0xsignedtx', disableAlternativeRPC: true });
    });

    it('adds the Cardano staking pending transaction and spends the voting delegation', async () => {
        const services = buildStore();

        await push(services, { account: adaAccount, stakeType: 'change-delegate' });

        const fakePendingAction = services.store
            .getActions()
            .find(addFakePendingCardanoTxThunk.pending.match);
        expect(fakePendingAction?.meta.arg).toMatchObject({
            txid: '0xpushedtxid',
            cardanoSpecific: { subtype: 'governance_delegation' },
        });
        expect(services.store.getActions()).toContainEqual(
            stakeActions.clearAccountVotingDelegation(),
        );
        expect(getToastPayloads(services.store)).toEqual([
            expect.objectContaining({ type: 'tx-voted', stage: 'pending' }),
        ]);
    });

    it('reports a failed broadcast with a toast and a typed rejection', async () => {
        pushTransactionMock.mockResolvedValue({
            success: false,
            error: { message: 'broadcast failed', code: 'Failure_UnknownCode' },
        });
        const services = buildStore();

        const result = await push(services);

        expect(result).toMatchObject({
            ok: false,
            error: { error: 'push-transaction-failed' },
        });
        expect(getToastPayloads(services.store)).toEqual([
            expect.objectContaining({ type: 'sign-tx-error', error: 'broadcast failed' }),
        ]);
    });

    it('rejects with a pending conflict when the broadcast hits a replacement', async () => {
        pushTransactionMock.mockResolvedValue({
            success: false,
            error: { message: 'could not replace existing tx', code: 'Failure_UnknownCode' },
        });

        const result = await push(buildStore());

        expect(result).toMatchObject({
            ok: false,
            error: { error: 'push-transaction-pending-conflict' },
        });
    });

    it('rejects when the account is not found', async () => {
        const services = buildStore();
        const unknownAccount = mockWalletAccount({
            symbol: asNetworkSymbol('eth'),
            descriptor: asAccountDescriptor('0x0000000000000000000000000000000000000001'),
        });

        const result = await push(services, { account: unknownAccount });

        expect(result).toEqual({
            ok: false,
            error: { error: 'sign-transaction-failed', message: 'Account not found.' },
        });
        expect(pushTransactionMock).not.toHaveBeenCalled();
    });
});
