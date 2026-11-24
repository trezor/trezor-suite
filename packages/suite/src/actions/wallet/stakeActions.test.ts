import { type UnknownAction } from '@reduxjs/toolkit';

import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { modalReducer, openModal } from '@suite/modal';
import { deviceInitialState } from '@suite-common/device';
import { mockStakingQueryClient } from '@suite-common/earn-staking/mocks';
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
    sendFormActions,
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
import { TrezorBlockchain } from '@trezor/blockchain-core';
import { asGetter } from '@trezor/dependency-injection';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import {
    type SignTransactionThunkDeps,
    type SignTransactionThunkState,
    signTransactionThunk,
} from './stakeActions';
import { cancelSigningModalOnDisconnectThunk } from '../suite/cancelSigningModalOnDisconnectThunk';

const mockCardanoSignTransactionThunk = jest.fn();
const mockNotifyEarnTransactionBroadcastThunk = jest.fn();
const mockAddFakePendingCardanoTxThunk = jest.fn();
const mockSyncAccountsWithBlockchainThunk = jest.fn();

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    notifyEarnTransactionBroadcastThunk: (params: unknown) =>
        mockNotifyEarnTransactionBroadcastThunk(params),
    addFakePendingCardanoTxThunk: (params: unknown) => mockAddFakePendingCardanoTxThunk(params),
    syncAccountsWithBlockchainThunk: (symbol: unknown) =>
        mockSyncAccountsWithBlockchainThunk(symbol),
}));

jest.mock('./stake/stakeFormEthereumActions', () => ({
    signTransactionThunk: () => () => Promise.resolve('signed-eth-tx'),
}));

jest.mock('./stake/stakeFormCardanoActions', () => ({
    signTransactionThunk: (params: unknown) => mockCardanoSignTransactionThunk(params),
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

const pushTransactionMock = TrezorBlockchain.pushTransaction as jest.Mock;

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

const createStakeFlow = (stakeAccount = account) => {
    const stakeReducer = prepareStakeReducer(undefined);
    let actions: unknown[] = [];

    // The thunks read the stake state they themselves write, so the recorded actions are reduced
    // through the real stake reducer. There is no selected account in this state at all.
    const getState = () =>
        ({
            device: { ...deviceInitialState, selectedDevice: mockSuiteDevice() },
            messageSystem: messageSystemInitialState,
            wallet: {
                accounts: [stakeAccount],
                settings: initialWalletSettingsState,
                stake: (actions as UnknownAction[]).reduce(stakeReducer, stakeInitialState),
                transactions: transactionsInitialState,
            },
        }) as unknown as SignTransactionThunkState;

    const extra: SignTransactionThunkDeps = {
        services: {
            analytics: mockDesktopAnalytics(),
            queryClient: mockStakingQueryClient(),
            networks: { getAccountSyncInterval: mockGetAccountSyncInterval() },
            getIsWindowVisible: asGetter(() => true),
            getTradedAccountKeys: asGetter(() => []),
        },
    };

    const mockDispatch = createMockDispatch({ getState, extra });
    actions = mockDispatch.actions;

    return { ...mockDispatch, getState, extra };
};

const signStakeTransaction = async (stakeForm = formValues) => {
    const flow = createStakeFlow();

    await signTransactionThunk({
        accountKey: account.key,
        device: mockSuiteDevice(),
        formValues: stakeForm,
        transactionInfo,
    })(flow.dispatch, flow.getState, flow.extra);

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
        pushTransactionMock.mockResolvedValue({ success: true, payload: { txid: TXID } });
    });

    it('clears only the staking review when its device disconnects before push', async () => {
        const ethAccount = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
        const { dispatch, getState, extra, onDispatch, actions } = createStakeFlow(ethAccount);
        const opened = onDispatch((action, resolve) => {
            if (openModal.match(action) && action.payload.type === 'review-transaction') resolve();
        });
        const signing = signTransactionThunk({
            device: mockSuiteDevice(),
            accountKey: ethAccount.key,
            formValues,
            transactionInfo,
        })(dispatch, getState, extra);
        await opened;
        expect(selectStake(getState()).serializedTx?.tx).toBe('signed-eth-tx');

        cancelSigningModalOnDisconnectThunk(mockSuiteDevice().path)(dispatch, () => ({
            modal: (actions as UnknownAction[]).reduce(
                modalReducer,
                modalReducer(undefined, { type: 'init' }),
            ),
        }));
        await signing;

        expect(selectStake(getState()).serializedTx).toBeUndefined();
        expect(selectStakeAccountKey(getState())).toBeUndefined();
        expect(actions).not.toContainEqual(sendFormActions.discardTransaction());
        expect(pushTransactionMock).not.toHaveBeenCalled();
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
            disableAlternativeRPC: false,
        });
        expect(mockNotifyEarnTransactionBroadcastThunk).toHaveBeenCalledWith(
            expect.objectContaining({ account, txid: TXID, flow: 'stake' }),
        );
    });

    it('forgets the review account once the transaction is pushed', async () => {
        const { getState } = await signStakeTransaction();

        expect(selectStakeAccountKey(getState())).toBeUndefined();
        expect(selectStake(getState()).precomposedTx).toBeUndefined();
    });

    it('forgets the review account when signing is cancelled on the device', async () => {
        mockCardanoSignTransactionThunk.mockReturnValue(() =>
            Promise.resolve({ success: false, error: { message: 'Failure_ActionCancelled' } }),
        );

        const { getState } = await signStakeTransaction();

        expect(pushTransactionMock).not.toHaveBeenCalled();
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

    it('reopens unstake for the same account after signing is cancelled', async () => {
        mockCardanoSignTransactionThunk.mockReturnValue(() =>
            Promise.resolve({ success: false, error: { message: 'Failure_ActionCancelled' } }),
        );

        const { actions } = await signStakeTransaction({ ...formValues, stakeType: 'unstake' });

        expect(actions).toContainEqual(openModal({ type: 'unstake', accountKey: account.key }));
    });

    it('reopens unstake for the same account after a broadcast failure', async () => {
        pushTransactionMock.mockResolvedValue({ success: false, error: { message: 'Rejected' } });

        const { actions } = await signStakeTransaction({ ...formValues, stakeType: 'unstake' });

        expect(actions).toContainEqual(openModal({ type: 'unstake', accountKey: account.key }));
    });
});
