import { captureException, withScope } from '@sentry/core';

import { type AnalyticsDep, type AnalyticsSharedEvents } from '@suite-common/analytics';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type TestCompositionStore, createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import TrezorConnect from '@trezor/connect';
import { type WithServices } from '@trezor/redux-utils';
import { createDeferred } from '@trezor/utils';

import { buildFreezeReviewForm } from './adapter/contracts/freezeContract';
import { type TronStakingStepRequest } from './adapter/types';
import { reportTronVoteTxId } from './shared/reportTronVoteTxId';
import { signTronContract } from './shared/signTronContract';
import { tronStakeActions } from './tronStakingReducer';
import { composeTronStakingStepThunk, submitTronStakingStepThunk } from './tronStakingStepThunks';
import { type TronFlow } from './tronStakingTypes';
import { transactionsActions } from '../../transactions/transactionsActions';
import {
    type AddFakePendingTronTxThunkState,
    addFakePendingTronTxThunk,
} from '../../transactions/transactionsThunks';

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
jest.mock('./shared/reportTronVoteTxId', () => ({ reportTronVoteTxId: jest.fn() }));
jest.mock('./shared/signTronContract', () => ({ signTronContract: jest.fn() }));

const analytics = mockAnalytics<AnalyticsSharedEvents>();

const ACCOUNT_KEY = 'tron-account' as AccountKey;
const ACCOUNT_ADDRESS = 'TVDGpn4hCSzJ5nkHPLetk8KQBtwaTppnkr';
const REPRESENTATIVE_ADDRESS = 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9';
const OTHER_REPRESENTATIVE_ADDRESS = 'TKWJhMU8NAviZ9TN5hroaFQPZ83FNctzz4';
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
    createTestCompositionRoot<WithServices<AnalyticsDep>, AddFakePendingTronTxThunkState>({
        services: () => ({ analytics }),
        preloadedState: {
            wallet: {
                blockchain: { [trxSymbol]: { blockHeight: 100 } },
                fees: { [trxSymbol]: { data: { blockTime: 3 } } },
            },
        },
    }).services.store;

const ALLOCATIONS = [{ address: REPRESENTATIVE_ADDRESS, count: 10 }];

type SubmitStepParams = {
    request: TronStakingStepRequest;
    flow?: TronFlow;
    account?: Account;
    requestConsent?: () => Promise<boolean>;
    requestPushApproval?: () => Promise<boolean>;
    onSettled?: () => void;
};

const submitStep = ({
    request,
    flow = FLOW,
    account = buildAccount(),
    requestConsent,
    requestPushApproval = () => Promise.resolve(true),
    onSettled,
}: SubmitStepParams) =>
    submitTronStakingStepThunk({
        account,
        device,
        flow,
        request,
        requestConsent,
        requestPushApproval,
        onSettled,
    });

const submitVote = (
    store: TestCompositionStore<AddFakePendingTronTxThunkState, WithServices<AnalyticsDep>>,
    account = buildAccount(),
    requestPushApproval = () => Promise.resolve(true),
) =>
    store.dispatch(
        submitStep({
            request: { type: 'vote', allocations: ALLOCATIONS },
            account,
            requestPushApproval,
        }),
    );

const getSubmitFinishedActions = (
    store: TestCompositionStore<AddFakePendingTronTxThunkState, WithServices<AnalyticsDep>>,
) => store.getActions().filter(tronStakeActions.submitFinished.match);

beforeEach(() => {
    jest.clearAllMocks();
    withScopeMock.mockImplementation(callback => callback(scope));
    tronComposeTransactionMock.mockResolvedValue({ success: true, payload: { bandwidth: 300 } });
    signTronContractMock.mockResolvedValue({ serializedTx: SERIALIZED_TX, txid: SIGNED_TXID });
    reportTronVoteTxIdMock.mockResolvedValue(true);
    pushTransactionMock.mockResolvedValue({ success: true, payload: { txid: SIGNED_TXID } });
});

describe('submitTronStakingStepThunk for a vote', () => {
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
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'transaction/cancel',
            payload: { txType: 'stake', networkSymbol: 'trx', stage: 'review' },
        });
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

        expect(
            store
                .getActions()
                .filter(transactionsActions.transactionBroadcastStatus.match)
                .map(action => action.payload),
        ).toEqual([{ account: buildAccount(), flow: FLOW, status: 'error' }]);
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

    it('signs a contract carrying one vote entry per allocation and reviews their total', async () => {
        const store = initStore();

        await store.dispatch(
            submitStep({
                request: {
                    type: 'vote',
                    allocations: [
                        { address: REPRESENTATIVE_ADDRESS, count: 16 },
                        { address: OTHER_REPRESENTATIVE_ADDRESS, count: 30 },
                    ],
                },
            }),
        );

        expect(signTronContractMock).toHaveBeenCalledWith(
            expect.objectContaining({
                contract: expect.objectContaining({
                    parameter: {
                        value: expect.objectContaining({
                            votes: [
                                expect.objectContaining({ count: 16 }),
                                expect.objectContaining({ count: 30 }),
                            ],
                        }),
                    },
                }),
            }),
        );

        const storedForms = store
            .getActions()
            .filter(tronStakeActions.storePrecomposedTransaction.match)
            .map(action => action.payload.precomposedForm);
        expect(storedForms).toEqual([
            expect.objectContaining({
                tronStaking: {
                    kind: 'vote',
                    votes: '46',
                    allocations: [
                        { address: REPRESENTATIVE_ADDRESS, votes: '16' },
                        { address: OTHER_REPRESENTATIVE_ADDRESS, votes: '30' },
                    ],
                },
            }),
        ]);
    });

    it('leaves representatives without votes out of the review and the pending transaction', async () => {
        const store = initStore();

        await store.dispatch(
            submitStep({
                request: {
                    type: 'vote',
                    allocations: [
                        { address: REPRESENTATIVE_ADDRESS, count: 16 },
                        { address: OTHER_REPRESENTATIVE_ADDRESS, count: 0 },
                    ],
                },
            }),
        );

        const storedForms = store
            .getActions()
            .filter(tronStakeActions.storePrecomposedTransaction.match)
            .map(action => action.payload.precomposedForm);
        expect(storedForms).toEqual([
            expect.objectContaining({
                tronStaking: {
                    kind: 'vote',
                    votes: '16',
                    allocations: [{ address: REPRESENTATIVE_ADDRESS, votes: '16' }],
                },
            }),
        ]);

        const pendingTransactionArguments = store
            .getActions()
            .filter(addFakePendingTronTxThunk.pending.match)
            .map(action => action.meta.arg);
        expect(pendingTransactionArguments).toEqual([
            expect.objectContaining({
                target: { addresses: [REPRESENTATIVE_ADDRESS], amount: '0' },
                tronSpecific: expect.objectContaining({
                    votes: [{ address: REPRESENTATIVE_ADDRESS, count: '16' }],
                }),
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

describe('Tron signing cancellation analytics', () => {
    const submissions = [
        ['vote', () => submitStep({ request: { type: 'vote', allocations: ALLOCATIONS } })],
        [
            'stake',
            () =>
                submitStep({
                    flow: 'stake',
                    request: { type: 'freeze', amount: '1', resourceType: 'energy' },
                }),
        ],
        [
            'unstake',
            () =>
                submitStep({
                    flow: 'unstake',
                    request: { type: 'unstake', amount: '1', resourceType: 'bandwidth' },
                }),
        ],
        ['claim', () => submitStep({ flow: 'claim', request: { type: 'claim' } })],
        ['withdraw', () => submitStep({ flow: 'withdraw', request: { type: 'withdraw' } })],
    ] as const;

    it.each(submissions)('reports a signing cancellation once for %s', async (_, submit) => {
        signTronContractMock.mockResolvedValue({ error: { kind: 'cancelled' } });
        const store = initStore();

        await store.dispatch(submit());

        expect(signTronContractMock).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'transaction/cancel',
            payload: { txType: 'stake', networkSymbol: 'trx', stage: 'signing' },
        });
        expect(pushTransactionMock).not.toHaveBeenCalled();
    });

    it.each(submissions)(
        'does not report cancellation for a %s signing failure',
        async (_, submit) => {
            signTronContractMock.mockResolvedValue({
                error: { kind: 'sign-failed', message: 'disconnected' },
            });
            const store = initStore();

            await store.dispatch(submit());

            expect(signTronContractMock).toHaveBeenCalledTimes(1);
            expect(analytics.report).not.toHaveBeenCalled();
            expect(pushTransactionMock).not.toHaveBeenCalled();
        },
    );
});

describe('submitTronStakingStepThunk for the other steps', () => {
    const NOW_SECONDS = 1_700_000_000;

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('freezes without reporting the transaction id and shows the freeze as pending', async () => {
        const store = initStore();

        await store.dispatch(
            submitStep({
                flow: 'stake',
                request: { type: 'freeze', amount: '1', resourceType: 'energy' },
            }),
        );

        expect(reportTronVoteTxIdMock).not.toHaveBeenCalled();
        expect(pushTransactionMock).toHaveBeenCalledTimes(1);
        expect(
            store
                .getActions()
                .filter(tronStakeActions.storePrecomposedTransaction.match)
                .map(action => action.payload.precomposedForm),
        ).toEqual([buildFreezeReviewForm('energy')]);
        expect(
            store
                .getActions()
                .filter(addFakePendingTronTxThunk.pending.match)
                .map(action => action.meta.arg),
        ).toEqual([
            expect.objectContaining({
                txid: SIGNED_TXID,
                type: 'self',
                target: { addresses: [ACCOUNT_ADDRESS], amount: '1000000' },
                tronSpecific: expect.objectContaining({
                    contractType: 'FreezeBalanceV2Contract',
                    resource: 'ENERGY',
                    stakeAmount: '1000000',
                }),
            }),
        ]);
        expect(getSubmitFinishedActions(store)).toEqual([
            tronStakeActions.submitFinished({
                accountKey: ACCOUNT_KEY,
                flow: 'stake',
                txid: SIGNED_TXID,
            }),
        ]);
    });

    it('shows a withdrawal as pending with the TRX whose unfreeze has expired', async () => {
        jest.spyOn(Date, 'now').mockReturnValue(NOW_SECONDS * 1000);
        const store = initStore();
        const account = buildAccount({
            misc: {
                tronResources: {
                    availableFreeBandwidth: 600,
                    availableStakedBandwidth: 0,
                    stakingInfo: {
                        stakedBalance: '0',
                        votes: [],
                        unstakingBatches: [
                            { amount: '4000000', expireTime: NOW_SECONDS - 1 },
                            { amount: '6000000', expireTime: NOW_SECONDS + 1 },
                        ],
                        unclaimedReward: '0',
                    },
                },
            },
        } as unknown as Partial<Account>);

        await store.dispatch(
            submitStep({ flow: 'withdraw', account, request: { type: 'withdraw' } }),
        );

        expect(
            store
                .getActions()
                .filter(addFakePendingTronTxThunk.pending.match)
                .map(action => action.meta.arg.target),
        ).toEqual([{ addresses: [ACCOUNT_ADDRESS], amount: '4000000' }]);
    });

    it('rejects a step it cannot plan before starting the submission', async () => {
        const store = initStore();

        await store.dispatch(
            submitStep({
                flow: 'claim',
                account: buildAccount({ descriptor: 'invalid' } as Partial<Account>),
                request: { type: 'claim' },
            }),
        );

        expect(signTronContractMock).not.toHaveBeenCalled();
        expect(store.getActions()).not.toContainEqual(
            tronStakeActions.submitStarted({ accountKey: ACCOUNT_KEY, flow: 'claim' }),
        );
        expect(getSubmitFinishedActions(store)).toEqual([
            tronStakeActions.submitFinished({
                accountKey: ACCOUNT_KEY,
                flow: 'claim',
                error: { kind: 'compose-failed', message: 'Invalid owner address.' },
            }),
        ]);
    });

    it('does nothing when the consent is declined', async () => {
        const store = initStore();

        await store.dispatch(
            submitStep({
                request: { type: 'vote', allocations: ALLOCATIONS },
                requestConsent: () => Promise.resolve(false),
            }),
        );

        expect(signTronContractMock).not.toHaveBeenCalled();
        expect(getSubmitFinishedActions(store)).toEqual([]);
    });

    it('finishes with a compose failure and settles when the fee cannot be estimated', async () => {
        tronComposeTransactionMock.mockResolvedValue({
            success: false,
            payload: { error: 'Node is down' },
            error: { message: 'Node is down' },
        });
        const onSettled = jest.fn();
        const store = initStore();

        await store.dispatch(
            submitStep({
                flow: 'unstake',
                request: { type: 'unstake', amount: '1', resourceType: 'energy' },
                onSettled,
            }),
        );

        expect(signTronContractMock).not.toHaveBeenCalled();
        expect(onSettled).toHaveBeenCalledTimes(1);
        expect(getSubmitFinishedActions(store)).toEqual([
            tronStakeActions.submitFinished({
                accountKey: ACCOUNT_KEY,
                flow: 'unstake',
                error: { kind: 'compose-failed' },
            }),
        ]);
    });
});

describe(composeTronStakingStepThunk.name, () => {
    it('composes the fee levels of a planned step', async () => {
        const store = initStore();

        const levels = await store
            .dispatch(
                composeTronStakingStepThunk({
                    account: buildAccount(),
                    request: { type: 'claim' },
                }),
            )
            .unwrap();

        expect(levels.normal).toMatchObject({
            type: 'final',
            bytes: 300,
            outputs: [{ address: ACCOUNT_ADDRESS, amount: '0' }],
        });
        expect(tronComposeTransactionMock).toHaveBeenCalledWith(
            expect.objectContaining({ blockHeight: 0 }),
        );
    });

    it('rejects a step it cannot plan with the reason', async () => {
        const store = initStore();

        await expect(
            store
                .dispatch(
                    composeTronStakingStepThunk({
                        account: buildAccount(),
                        request: { type: 'freeze', amount: '0', resourceType: 'energy' },
                    }),
                )
                .unwrap(),
        ).rejects.toEqual({ kind: 'compose-failed', message: 'Invalid amount.' });
        expect(tronComposeTransactionMock).not.toHaveBeenCalled();
    });
});
