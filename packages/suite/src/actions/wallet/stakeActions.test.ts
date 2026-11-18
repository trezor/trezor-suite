import { type UnknownAction } from '@reduxjs/toolkit';

import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { openModal } from '@suite/modal';
import { deviceInitialState } from '@suite-common/device';
import { messageSystemInitialState } from '@suite-common/message-system';
import { mockGetAccountSyncInterval } from '@suite-common/networks/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    blockchainInitialState,
    getStakeFormsDefaultValues,
    initialWalletSettingsState,
    prepareStakeReducer,
    selectStake,
    selectStakeAccountKey,
    stakeActions,
    stakeInitialState,
    transactionsActions,
    transactionsInitialState,
} from '@suite-common/wallet-core';
import {
    type Account,
    type PrecomposedTransactionFinal,
    type PrecomposedTransactionFinalBumpFeeRbf,
    type StakeFormState,
    asAccountDescriptor,
} from '@suite-common/wallet-types';
import {
    mockWalletAccount,
    networkSpecificDefaultEthereum,
} from '@suite-common/wallet-types/mocks';
import TrezorConnect, { type EthereumTransaction } from '@trezor/connect';
import { asGetter } from '@trezor/dependency-injection';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import {
    type SignTransactionThunkDeps,
    type SignTransactionThunkState,
    signTransactionThunk,
} from './stakeActions';

const mockCardanoSignTransactionThunk = jest.fn();
const mockEthereumSignTransactionThunk = jest.fn();
const mockReplaceTransactionThunk = jest.fn();
const mockNotifyEarnTransactionBroadcastThunk = jest.fn();
const mockAddFakePendingCardanoTxThunk = jest.fn();
const mockSyncAccountsWithBlockchainThunk = jest.fn();

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    notifyEarnTransactionBroadcastThunk: (params: unknown) =>
        mockNotifyEarnTransactionBroadcastThunk(params),
    addFakePendingCardanoTxThunk: (params: unknown) => mockAddFakePendingCardanoTxThunk(params),
    replaceTransactionThunk: (params: unknown) => mockReplaceTransactionThunk(params),
    syncAccountsWithBlockchainThunk: (symbol: unknown) =>
        mockSyncAccountsWithBlockchainThunk(symbol),
}));

jest.mock('./stake/stakeFormCardanoActions', () => ({
    signTransactionThunk: (params: unknown) => mockCardanoSignTransactionThunk(params),
}));

// Non-Cardano networks push only once the user confirms the review modal.
jest.mock('@suite/modal', () => ({
    ...jest.requireActual('@suite/modal'),
    openDeferredModal: () => () => Promise.resolve(true),
}));

jest.mock('./stake/stakeFormEthereumActions', () => ({
    signTransactionThunk: (params: unknown) => mockEthereumSignTransactionThunk(params),
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

const createStakeFlow = (stakeAccount: Account = account) => {
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
                blockchain: blockchainInitialState,
                fees: {
                    eth: {
                        status: 'loaded',
                        data: {
                            blockHeight: 1,
                            blockTime: 12,
                            minFee: 1,
                            maxFee: 100,
                            minPriorityFee: 1,
                            levels: [],
                        },
                    },
                },
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

const signStakeTransaction = async ({
    stakeAccount = account,
    stakeForm = formValues,
    stakeTransactionInfo = transactionInfo,
}: {
    stakeAccount?: Account;
    stakeForm?: StakeFormState;
    stakeTransactionInfo?: PrecomposedTransactionFinal;
} = {}) => {
    const flow = createStakeFlow(stakeAccount);

    await signTransactionThunk({
        accountKey: stakeAccount.key,
        formValues: stakeForm,
        transactionInfo: stakeTransactionInfo,
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

        const { actions } = await signStakeTransaction({
            stakeForm: { ...formValues, stakeType: 'unstake' },
        });

        expect(actions).toContainEqual(openModal({ type: 'unstake', accountKey: account.key }));
    });

    it('reopens unstake for the same account after a broadcast failure', async () => {
        pushTransactionMock.mockResolvedValue({ success: false, error: { message: 'Rejected' } });

        const { actions } = await signStakeTransaction({
            stakeForm: { ...formValues, stakeType: 'unstake' },
        });

        expect(actions).toContainEqual(openModal({ type: 'unstake', accountKey: account.key }));
    });
});

describe('signTransactionThunk on an EVM account', () => {
    const PREV_TXID = 'replaced-txid';
    const UNSTAKE_DATA = '0x76ec871c';
    const POOL_ADDRESS = '0xD523794C879D9eC028960a231F866758e405bE34';

    const ethAccount: Account = mockWalletAccount(
        { symbol: asNetworkSymbol('eth'), descriptor: asAccountDescriptor('earnEthDescriptor') },
        networkSpecificDefaultEthereum,
    );

    // What prepareUnstakeEthTx hands to the device: no value moves, the calldata says what happens.
    const signedUnstakeTransaction: EthereumTransaction = {
        to: POOL_ADDRESS,
        value: '0x0',
        data: UNSTAKE_DATA,
        gasLimit: '0x30d40',
        gasPrice: '0x3b9aca00',
        nonce: '0x7',
        chainId: 1,
    };

    const getAddedTransactions = (actions: unknown[]) =>
        actions.filter(transactionsActions.addTransaction.match);

    beforeEach(() => {
        jest.clearAllMocks();
        mockEthereumSignTransactionThunk.mockReturnValue(() =>
            Promise.resolve({
                serializedTx: 'signed-eth-tx',
                transaction: signedUnstakeTransaction,
            }),
        );
        mockNotifyEarnTransactionBroadcastThunk.mockReturnValue({ type: 'mock/notify' });
        mockReplaceTransactionThunk.mockReturnValue({ type: 'mock/replaceTransaction' });
        mockSyncAccountsWithBlockchainThunk.mockReturnValue({ type: 'mock/sync' });
        pushTransactionMock.mockResolvedValue({ success: true, payload: { txid: TXID } });
    });

    it('adds a pending record of the signed transaction, with its nonce and calldata', async () => {
        const { actions } = await signStakeTransaction({ stakeAccount: ethAccount });

        const addedTransactions = getAddedTransactions(actions);

        expect(addedTransactions).toHaveLength(1);
        expect(addedTransactions[0]?.payload.account).toBe(ethAccount);
        expect(addedTransactions[0]?.payload.transactions).toEqual([
            expect.objectContaining({
                txid: TXID,
                type: 'sent',
                amount: '0',
                targets: [expect.objectContaining({ addresses: [POOL_ADDRESS] })],
                ethereumSpecific: expect.objectContaining({
                    status: -1,
                    nonce: 7,
                    data: UNSTAKE_DATA,
                }),
            }),
        ]);
    });

    it('keeps a single record for a fee bump, moved to the new txid', async () => {
        const bumpFeeTransactionInfo: PrecomposedTransactionFinalBumpFeeRbf = {
            ...transactionInfo,
            rbfType: 'bump-fee',
            prevTxid: PREV_TXID,
            feeDifference: '1000',
            useNativeRbf: false,
        };

        const { actions } = await signStakeTransaction({
            stakeAccount: ethAccount,
            stakeTransactionInfo: bumpFeeTransactionInfo,
        });

        expect(mockReplaceTransactionThunk).toHaveBeenCalledWith(
            expect.objectContaining({ newTxid: TXID }),
        );
        expect(getAddedTransactions(actions)).toEqual([]);
    });

    it('adds no record when the push fails', async () => {
        pushTransactionMock.mockResolvedValue({ success: false, error: { message: 'rejected' } });

        const { actions } = await signStakeTransaction({ stakeAccount: ethAccount });

        expect(getAddedTransactions(actions)).toEqual([]);
    });
});
