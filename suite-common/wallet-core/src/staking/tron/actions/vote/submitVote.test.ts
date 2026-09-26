import { captureException, withScope } from '@sentry/core';

import { type TrezorDevice } from '@suite-common/suite-types';
import { type TestCompositionStore, createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';
import { createDeferred } from '@trezor/utils';

import { submitTronVoteThunk } from './submitVote';
import { type AddFakePendingTronTxThunkState } from '../../../../transactions/transactionsThunks';
import { reportTronVoteTxId } from '../../shared/reportTronVoteTxId';
import { signTronContract } from '../../shared/signTronContract';
import { tronStakeActions } from '../../tronStakingReducer';

jest.mock('@sentry/core', () => ({ captureException: jest.fn(), withScope: jest.fn() }));
jest.mock('@trezor/connect', () => {
    const actual = jest.requireActual('@trezor/connect');

    return {
        ...actual,
        __esModule: true,
        default: {
            ...actual.default,
            tronComposeTransaction: jest.fn(),
            pushTransaction: jest.fn(),
        },
    };
});
jest.mock('../../shared/reportTronVoteTxId', () => ({ reportTronVoteTxId: jest.fn() }));
jest.mock('../../shared/signTronContract', () => ({ signTronContract: jest.fn() }));

const ACCOUNT_KEY = 'tron-account' as AccountKey;
const ACCOUNT_ADDRESS = 'TVDGpn4hCSzJ5nkHPLetk8KQBtwaTppnkr';
const REPRESENTATIVE_ADDRESS = 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9';
const SIGNED_TXID = 'a'.repeat(64);
const OTHER_TXID = 'b'.repeat(64);
const SERIALIZED_TX = '0a0201';
const FLOW = 'vote' as const;

const trxSymbol = asNetworkSymbol('trx');
const ttrxSymbol = asNetworkSymbol('ttrx');

const withScopeMock = withScope as jest.Mock;
const captureExceptionMock = jest.mocked(captureException);
const reportTronVoteTxIdMock = jest.mocked(reportTronVoteTxId);
const signTronContractMock = jest.mocked(signTronContract);
const tronComposeTransactionMock = TrezorConnect.tronComposeTransaction as jest.Mock;
const pushTransactionMock = TrezorConnect.pushTransaction as jest.Mock;
const scope = { setTag: jest.fn(), setExtra: jest.fn(), setLevel: jest.fn() };

const device = {
    path: '1',
    instance: 0,
    state: { staticSessionId: 'session@1:0' },
    useEmptyPassphrase: true,
} as unknown as TrezorDevice;

const buildAccount = (overrides?: Partial<Account>): Account =>
    ({
        key: ACCOUNT_KEY,
        symbol: trxSymbol,
        networkType: 'tron',
        accountType: 'normal',
        descriptor: ACCOUNT_ADDRESS,
        availableBalance: '1000000',
        misc: {
            tronResources: {
                availableFreeBandwidth: 600,
                availableStakedBandwidth: 0,
                stakingInfo: { totalVotingPower: '10' },
            },
        },
        ...overrides,
    }) as unknown as Account;

const initStore = () =>
    createTestCompositionRoot<void, AddFakePendingTronTxThunkState>({
        preloadedState: {
            wallet: {
                blockchain: { [trxSymbol]: { blockHeight: 100 } },
                fees: { [trxSymbol]: { data: { blockTime: 3 } } },
            },
        },
    }).services.store;

const submitVote = (
    store: TestCompositionStore<AddFakePendingTronTxThunkState, void>,
    account = buildAccount(),
    requestPushApproval = () => Promise.resolve(true),
) =>
    store.dispatch(
        submitTronVoteThunk({
            account,
            device,
            flow: FLOW,
            representativeAddress: REPRESENTATIVE_ADDRESS,
            requestPushApproval,
        }),
    );

const getSubmitFinishedActions = (
    store: TestCompositionStore<AddFakePendingTronTxThunkState, void>,
) => store.getActions().filter(tronStakeActions.submitFinished.match);

beforeEach(() => {
    jest.clearAllMocks();
    withScopeMock.mockImplementation(callback => callback(scope));
    tronComposeTransactionMock.mockResolvedValue({ success: true, payload: { bandwidth: 300 } });
    signTronContractMock.mockResolvedValue({ serializedTx: SERIALIZED_TX, txid: SIGNED_TXID });
    reportTronVoteTxIdMock.mockResolvedValue(true);
    pushTransactionMock.mockResolvedValue({ success: true, payload: { txid: SIGNED_TXID } });
});

describe('submitTronVoteThunk', () => {
    it('broadcasts only after the signed txid has been reported', async () => {
        const reportRequested = createDeferred();
        const reportResult = createDeferred<boolean>();
        reportTronVoteTxIdMock.mockImplementation(() => {
            reportRequested.resolve();

            return reportResult.promise;
        });
        const store = initStore();

        const submission = submitVote(store);
        await reportRequested.promise;

        expect(reportTronVoteTxIdMock).toHaveBeenCalledWith(SIGNED_TXID);
        expect(pushTransactionMock).not.toHaveBeenCalled();

        reportResult.resolve(true);
        await submission;

        expect(pushTransactionMock).toHaveBeenCalledTimes(1);
        expect(pushTransactionMock).toHaveBeenCalledWith(
            expect.objectContaining({ tx: SERIALIZED_TX, coin: 'trx' }),
        );
        expect(getSubmitFinishedActions(store)).toEqual([
            tronStakeActions.submitFinished({
                accountKey: ACCOUNT_KEY,
                flow: FLOW,
                txid: SIGNED_TXID,
            }),
        ]);
        expect(captureExceptionMock).not.toHaveBeenCalled();
    });

    it('does not report until the push is approved and skips both when declined', async () => {
        const approvalRequested = createDeferred();
        const approvalResult = createDeferred<boolean>();
        const store = initStore();

        const submission = submitVote(store, buildAccount(), () => {
            approvalRequested.resolve();

            return approvalResult.promise;
        });
        await approvalRequested.promise;

        expect(signTronContractMock).toHaveBeenCalledTimes(1);
        expect(reportTronVoteTxIdMock).not.toHaveBeenCalled();

        approvalResult.resolve(false);
        await submission;

        expect(reportTronVoteTxIdMock).not.toHaveBeenCalled();
        expect(pushTransactionMock).not.toHaveBeenCalled();
        expect(getSubmitFinishedActions(store)).toEqual([
            tronStakeActions.submitFinished({
                accountKey: ACCOUNT_KEY,
                flow: FLOW,
                error: { kind: 'cancelled' },
            }),
        ]);
    });

    it('does not broadcast when the report fails', async () => {
        reportTronVoteTxIdMock.mockResolvedValue(false);
        const store = initStore();

        await submitVote(store);

        expect(pushTransactionMock).not.toHaveBeenCalled();
        expect(getSubmitFinishedActions(store)).toEqual([
            tronStakeActions.submitFinished({
                accountKey: ACCOUNT_KEY,
                flow: FLOW,
                error: { kind: 'report-failed' },
            }),
        ]);
    });

    it('captures a Sentry event when the broadcast fails after a successful report', async () => {
        pushTransactionMock.mockResolvedValue({
            success: false,
            payload: { error: 'Node rejected the transaction' },
            error: { message: 'Node rejected the transaction' },
        });
        const store = initStore();

        await submitVote(store);

        expect(captureExceptionMock).toHaveBeenCalledTimes(1);
        expect(scope.setTag).toHaveBeenCalledWith(
            'error.code',
            'tron_staking_broadcast_failed_after_report',
        );
        expect(scope.setTag).toHaveBeenCalledWith('error.kind', 'vote');
        expect(scope.setTag).toHaveBeenCalledWith('network.symbol', trxSymbol);
        expect(scope.setExtra.mock.calls).toEqual([
            ['errorMessage', 'Node rejected the transaction'],
        ]);
        expect(getSubmitFinishedActions(store)).toEqual([
            tronStakeActions.submitFinished({
                accountKey: ACCOUNT_KEY,
                flow: FLOW,
                error: { kind: 'broadcast-failed', message: 'Node rejected the transaction' },
            }),
        ]);
    });

    it('refuses to sign, report or broadcast for a Nile account', async () => {
        const store = initStore();

        await submitVote(store, buildAccount({ symbol: ttrxSymbol }));

        expect(signTronContractMock).not.toHaveBeenCalled();
        expect(reportTronVoteTxIdMock).not.toHaveBeenCalled();
        expect(pushTransactionMock).not.toHaveBeenCalled();
        expect(store.getActions()).not.toContainEqual(
            tronStakeActions.submitStarted({ accountKey: ACCOUNT_KEY, flow: FLOW }),
        );
        expect(getSubmitFinishedActions(store)).toEqual([
            tronStakeActions.submitFinished({
                accountKey: ACCOUNT_KEY,
                flow: FLOW,
                error: {
                    kind: 'compose-failed',
                    message: 'TRON voting is supported only for TRX mainnet accounts.',
                },
            }),
        ]);
    });

    it('captures a fatal Sentry event when the broadcast txid differs from the signed one', async () => {
        pushTransactionMock.mockResolvedValue({ success: true, payload: { txid: OTHER_TXID } });
        const store = initStore();

        await submitVote(store);

        expect(captureExceptionMock).toHaveBeenCalledTimes(1);
        expect(scope.setLevel).toHaveBeenCalledWith('fatal');
        expect(scope.setTag).toHaveBeenCalledWith(
            'error.code',
            'tron_staking_broadcast_txid_mismatch',
        );
        expect(scope.setTag).toHaveBeenCalledWith('network.symbol', trxSymbol);
        expect(scope.setExtra).not.toHaveBeenCalled();
        expect(getSubmitFinishedActions(store)).toEqual([
            tronStakeActions.submitFinished({
                accountKey: ACCOUNT_KEY,
                flow: FLOW,
                txid: OTHER_TXID,
            }),
        ]);
    });
});
