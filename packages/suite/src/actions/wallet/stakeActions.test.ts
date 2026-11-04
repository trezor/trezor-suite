import { type UnknownAction } from '@reduxjs/toolkit';

import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { deviceInitialState } from '@suite-common/device';
import { messageSystemInitialState } from '@suite-common/message-system';
import { mockGetAccountSyncInterval } from '@suite-common/networks/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    getStakeFormsDefaultValues,
    initialWalletSettingsState,
    prepareStakeReducer,
    selectStake,
    selectStakeAccountKey,
    stakeActions,
    stakeInitialState,
    transactionsInitialState,
} from '@suite-common/wallet-core';
import {
    type Account,
    type PrecomposedTransactionFinal,
    type StakeFormState,
    asAccountDescriptor,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import TrezorConnect from '@trezor/connect';
import { asGetter } from '@trezor/dependency-injection';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import {
    type SignTransactionThunkDeps,
    type SignTransactionThunkState,
    signTransactionThunk,
} from './stakeActions';

const mockCardanoSignTransactionThunk = jest.fn();
const mockNotifyEarnTransactionBroadcastThunk = jest.fn();
const mockAddFakePendingCardanoTxThunk = jest.fn();
const mockSyncAccountsWithBlockchainThunk = jest.fn();
const mockSolanaSignTransactionThunk = jest.fn();
const mockAddFakePendingSolanaStakeTxThunk = jest.fn();

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    notifyEarnTransactionBroadcastThunk: (params: unknown) =>
        mockNotifyEarnTransactionBroadcastThunk(params),
    addFakePendingCardanoTxThunk: (params: unknown) => mockAddFakePendingCardanoTxThunk(params),
    addFakePendingSolanaStakeTxThunk: (params: unknown) =>
        mockAddFakePendingSolanaStakeTxThunk(params),
    syncAccountsWithBlockchainThunk: (symbol: unknown) =>
        mockSyncAccountsWithBlockchainThunk(symbol),
}));

jest.mock('./stake/stakeFormCardanoActions', () => ({
    signTransactionThunk: (params: unknown) => mockCardanoSignTransactionThunk(params),
}));

jest.mock('./stake/stakeFormSolanaActions', () => ({
    signTransactionThunk: (params: unknown) => mockSolanaSignTransactionThunk(params),
}));

jest.mock('@suite/modal', () => ({
    ...jest.requireActual('@suite/modal'),
    openDeferredModal: () => () => Promise.resolve(true),
}));

jest.mock('@trezor/connect', () => {
    const actual = jest.requireActual('@trezor/connect');

    return {
        ...actual,
        __esModule: true,
        default: {
            ...actual.default,
            pushTransaction: jest.fn(),
        },
    };
});

const pushTransactionMock = TrezorConnect.pushTransaction as jest.Mock;

const SIGNED_TX = 'signed-cardano-tx';
const TXID = 'pushed-txid';

const account: Account = mockWalletAccount(
    { symbol: asNetworkSymbol('ada'), descriptor: asAccountDescriptor('earnAdaDescriptor') },
    { misc: { staking: { isActive: false } } },
);

const formValues: StakeFormState = {
    ...getStakeFormsDefaultValues({ address: account.descriptor, stakeType: 'stake' }),
    options: ['broadcast'],
    setMaxOutputId: undefined,
};

const transactionInfo: PrecomposedTransactionFinal = {
    type: 'final',
    fee: '174301',
    feePerByte: '44',
    bytes: 300,
    totalSpent: '1174301',
    max: undefined,
    inputs: [],
    outputs: [],
    outputsPermutation: [],
};

const solanaAccount: Account = mockWalletAccount({
    symbol: asNetworkSymbol('sol'),
    descriptor: asAccountDescriptor('earnSolDescriptor'),
});

const createStakeFlow = (flowAccount: Account = account) => {
    const stakeReducer = prepareStakeReducer(undefined);
    let actions: unknown[] = [];

    // The thunks read the stake state they themselves write, so the recorded actions are reduced
    // through the real stake reducer. There is no selected account in this state at all.
    const getState = () =>
        ({
            device: { ...deviceInitialState, selectedDevice: mockSuiteDevice() },
            messageSystem: messageSystemInitialState,
            wallet: {
                accounts: [flowAccount],
                settings: initialWalletSettingsState,
                stake: (actions as UnknownAction[]).reduce(stakeReducer, stakeInitialState),
                transactions: transactionsInitialState,
            },
        }) as unknown as SignTransactionThunkState;

    const extra: SignTransactionThunkDeps = {
        services: {
            analytics: mockDesktopAnalytics(),
            networks: { getAccountSyncInterval: mockGetAccountSyncInterval() },
            getIsWindowVisible: asGetter(() => true),
            getTradedAccountKeys: asGetter(() => []),
        },
    };

    const mockDispatch = createMockDispatch({ getState, extra });
    actions = mockDispatch.actions;

    return { ...mockDispatch, getState, extra };
};

const signStakeTransaction = async (flowAccount: Account = account) => {
    const flow = createStakeFlow(flowAccount);

    await signTransactionThunk({ accountKey: flowAccount.key, formValues, transactionInfo })(
        flow.dispatch,
        flow.getState,
        flow.extra,
    );

    return flow;
};

describe('signTransactionThunk', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockCardanoSignTransactionThunk.mockReturnValue(() =>
            Promise.resolve({ serializedTx: SIGNED_TX, poolDelegation: undefined }),
        );
        mockNotifyEarnTransactionBroadcastThunk.mockReturnValue({ type: 'mock/notify' });
        mockAddFakePendingCardanoTxThunk.mockReturnValue({ type: 'mock/addFakePendingTx' });
        mockSyncAccountsWithBlockchainThunk.mockReturnValue({ type: 'mock/sync' });
        mockAddFakePendingSolanaStakeTxThunk.mockReturnValue({ type: 'mock/addFakePendingSolTx' });
        pushTransactionMock.mockResolvedValue({ success: true, payload: { txid: TXID } });
    });

    it('stores the account the transaction is reviewed for', async () => {
        const { actions } = await signStakeTransaction();

        expect(actions).toContainEqual(
            stakeActions.requestSignTransaction({
                formValues,
                transactionInfo: expect.objectContaining({ type: 'final' }),
                accountKey: account.key,
            }),
        );
    });

    it('signs and pushes with the given account, without a selected account in the wallet', async () => {
        await signStakeTransaction();

        expect(mockCardanoSignTransactionThunk).toHaveBeenCalledWith(
            expect.objectContaining({ account }),
        );
        expect(pushTransactionMock).toHaveBeenCalledWith({
            tx: SIGNED_TX,
            coin: 'ada',
            identity: undefined,
        });
        expect(mockNotifyEarnTransactionBroadcastThunk).toHaveBeenCalledWith(
            expect.objectContaining({ account, txid: TXID, flow: 'stake' }),
        );
    });

    it('records the pending Solana stake with the blockhash validity of the signed transaction', async () => {
        const solanaTxMeta = {
            deviceAmountLamports: '1002282880',
            feeLamports: '5000',
            rentLamports: '2282880',
            feeIncludingRentLamports: '2287880',
            hasSplitInstruction: false,
            lastValidBlockHeight: 4200,
        };
        mockSolanaSignTransactionThunk.mockReturnValue(() =>
            Promise.resolve({ serializedTx: SIGNED_TX, solanaTxMeta }),
        );

        await signStakeTransaction(solanaAccount);

        expect(mockAddFakePendingSolanaStakeTxThunk).toHaveBeenCalledWith(
            expect.objectContaining({
                txid: TXID,
                precomposedTransaction: expect.objectContaining({ solanaTxMeta }),
            }),
        );
    });

    it('forgets the review account once the transaction is pushed', async () => {
        const { getState } = await signStakeTransaction();

        expect(selectStakeAccountKey(getState())).toBeUndefined();
        expect(selectStake(getState()).precomposedTx).toBeUndefined();
    });

    it('keeps the review account for a retry when signing times out', async () => {
        mockCardanoSignTransactionThunk.mockReturnValue(() =>
            Promise.resolve({ success: false, error: { message: 'tx-timeout' } }),
        );

        const { getState } = await signStakeTransaction();

        expect(pushTransactionMock).not.toHaveBeenCalled();
        expect(selectStakeAccountKey(getState())).toBe(account.key);
    });
});
