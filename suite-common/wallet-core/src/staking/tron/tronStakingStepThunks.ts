import { captureException, withScope } from '@sentry/core';

import { type AnalyticsDep, events } from '@suite-common/analytics';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type Account, type PrecomposedLevels } from '@suite-common/wallet-types';
import {
    computeBandwidthFeeLevel,
    getAccountIdentity,
    getTronResources,
} from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import { type WithServices, createThunk } from '@trezor/redux-utils';
import { exhaustive } from '@trezor/type-utils';

import { tronStakingAdapter } from './adapter/tronStakingAdapter';
import {
    type TronStakingPlanError,
    type TronStakingStep,
    type TronStakingStepFee,
    type TronStakingStepRequest,
} from './adapter/types';
import {
    TRON_DUMMY_BLOCK_HASH,
    TRON_DUMMY_BLOCK_HEIGHT,
    TRON_STAKE_MODULE,
} from './shared/constants';
import { reportTronVoteTxId } from './shared/reportTronVoteTxId';
import { signTronContract } from './shared/signTronContract';
import { tronStakeActions } from './tronStakingReducer';
import { type TronFlow, type TronStakeError } from './tronStakingTypes';
import { notifyEarnTransactionBroadcastThunk } from '../../earn/earnTransactionsThunks';
import { transactionsActions } from '../../transactions/transactionsActions';
import {
    type AddFakePendingTronTxThunkState,
    addFakePendingTronTxThunk,
} from '../../transactions/transactionsThunks';

const getPlanErrorMessage = (error: TronStakingPlanError): string => {
    switch (error.code) {
        case 'UNSUPPORTED_NETWORK':
            return 'Invalid network type.';
        case 'VOTING_UNSUPPORTED_NETWORK':
            return 'TRON voting is supported only for TRX mainnet accounts.';
        case 'INVALID_AMOUNT':
            return 'Invalid amount.';
        case 'INVALID_OWNER_ADDRESS':
            return 'Invalid owner address.';
        case 'INVALID_VOTE_ALLOCATION':
            return 'Invalid vote allocation.';
        default:
            return exhaustive(error);
    }
};

type ComposeTronStakingStepParams = {
    account: Account;
    step: TronStakingStep;
};

type ComposeTronStakingStepSuccess = {
    success: true;
    levels: PrecomposedLevels;
    fee: TronStakingStepFee;
};
type ComposeTronStakingStepFailure = { success: false; error: TronStakeError };

// The bandwidth is estimated against a dummy block; signing fetches the real block reference.
const composeTronStakingStep = async ({
    account,
    step,
}: ComposeTronStakingStepParams): Promise<
    ComposeTronStakingStepSuccess | ComposeTronStakingStepFailure
> => {
    const estimate = await TrezorConnect.tronComposeTransaction({
        contract: step.contract,
        blockHash: TRON_DUMMY_BLOCK_HASH,
        blockHeight: TRON_DUMMY_BLOCK_HEIGHT,
    });

    if (!estimate.success) {
        return {
            success: false,
            error: { kind: 'compose-failed', message: estimate.error.message },
        };
    }

    const bytes = estimate.payload.bandwidth;
    const tronResources = getTronResources(account);

    const feeLevel = computeBandwidthFeeLevel({
        availableStakedBandwidth: tronResources?.availableStakedBandwidth ?? 0,
        availableFreeBandwidth: tronResources?.availableFreeBandwidth ?? 0,
        bytes,
    });

    const fee: TronStakingStepFee = {
        fee: feeLevel.feePerTx || '0',
        feePerByte: feeLevel.feePerUnit ?? '0',
        bytes,
    };

    return {
        success: true,
        levels: { normal: tronStakingAdapter.composeStepTransaction(step, account, fee) },
        fee,
    };
};

type ComposeTronStakingStepThunkParams = {
    account: Account;
    request: TronStakingStepRequest;
};

export const composeTronStakingStepThunk = createThunk<
    PrecomposedLevels,
    ComposeTronStakingStepThunkParams,
    { rejectValue: TronStakeError }
>(
    `${TRON_STAKE_MODULE}/composeTronStakingStepThunk`,
    async ({ account, request }, { rejectWithValue }) => {
        const plan = tronStakingAdapter.planStep(request, account);

        if (!plan.success) {
            return rejectWithValue({
                kind: 'compose-failed',
                message: getPlanErrorMessage(plan.error),
            });
        }

        const composed = await composeTronStakingStep({ account, step: plan.step });

        return composed.success ? composed.levels : rejectWithValue(composed.error);
    },
);

type ReportBroadcastFailureParams = {
    step: TronStakingStep;
    account: Account;
    message: string;
};

const reportBroadcastFailedAfterTxidReport = ({
    step,
    account,
    message,
}: ReportBroadcastFailureParams) =>
    withScope(scope => {
        scope.setTag('error.code', 'tron_staking_broadcast_failed_after_report');
        scope.setTag('error.kind', step.type);
        scope.setTag('network.symbol', account.symbol);
        scope.setExtra('errorMessage', message);
        captureException(new Error('TRON vote broadcast failed after successful txid report.'));
    });

type ReportTxidMismatchParams = {
    step: TronStakingStep;
    account: Account;
};

const reportBroadcastTxidMismatch = ({ step, account }: ReportTxidMismatchParams) =>
    withScope(scope => {
        scope.setLevel('fatal');
        scope.setTag('error.code', 'tron_staking_broadcast_txid_mismatch');
        scope.setTag('error.kind', step.type);
        scope.setTag('network.symbol', account.symbol);
        captureException(
            new Error('TRON vote broadcast txid differs from the reported signed txid.'),
        );
    });

type SubmitTronStakingStepThunkParams = {
    account: Account;
    device: TrezorDevice;
    flow: TronFlow;
    request: TronStakingStepRequest;
    requestConsent?: () => Promise<boolean>;
    requestPushApproval: () => Promise<boolean>;
    onSigningStart?: () => void;
    onSettled?: () => void;
};

type SubmitTronStakingStepThunkState = AddFakePendingTronTxThunkState;

type SubmitTronStakingStepThunkDeps = WithServices<AnalyticsDep>;

// Runs one planned step: compose, review, sign, approve, broadcast and show it as pending. What
// differs between the steps comes from the Tron staking adapter.
export const submitTronStakingStepThunk = createThunk<
    void,
    SubmitTronStakingStepThunkParams,
    { state: SubmitTronStakingStepThunkState; extra: SubmitTronStakingStepThunkDeps }
>(
    `${TRON_STAKE_MODULE}/submitTronStakingStepThunk`,
    async (
        {
            account,
            device,
            flow,
            request,
            requestConsent,
            requestPushApproval,
            onSigningStart,
            onSettled,
        },
        { dispatch, extra },
    ) => {
        const { key: accountKey } = account;

        const finish = (result: { txid?: string; error?: TronStakeError }) =>
            dispatch(tronStakeActions.submitFinished({ accountKey, flow, ...result }));

        const reportCancellation = (stage: 'signing' | 'review') =>
            extra.services.analytics.report({
                type: events.transactionCancelEvent.name,
                payload: { txType: 'stake', networkSymbol: account.symbol, stage },
            });

        if (requestConsent) {
            const isConsentGiven = await requestConsent();

            if (!isConsentGiven) return;
        }

        const plan = tronStakingAdapter.planStep(request, account);

        if (!plan.success) {
            finish({ error: { kind: 'compose-failed', message: getPlanErrorMessage(plan.error) } });

            return;
        }

        const { step } = plan;

        dispatch(tronStakeActions.submitStarted({ accountKey, flow }));

        try {
            const composed = await composeTronStakingStep({ account, step });
            const precomposedTx =
                composed.success && composed.levels.normal?.type === 'final'
                    ? composed.levels.normal
                    : undefined;

            if (!composed.success || !precomposedTx) {
                finish({ error: { kind: 'compose-failed' } });

                return;
            }

            dispatch(
                tronStakeActions.storePrecomposedTransaction({
                    precomposedTx,
                    precomposedForm: step.reviewForm,
                    accountKey,
                }),
            );

            onSigningStart?.();

            const signResult = await signTronContract({ account, device, contract: step.contract });

            if ('error' in signResult) {
                if (signResult.error.kind === 'cancelled') {
                    reportCancellation('signing');
                }

                finish({ error: signResult.error });

                return;
            }

            dispatch(
                tronStakeActions.storeSignedTransaction({
                    serializedTx: { tx: signResult.serializedTx, symbol: account.symbol },
                }),
            );

            const isPushApproved = await requestPushApproval();

            if (!isPushApproved) {
                reportCancellation('review');
                finish({ error: { kind: 'cancelled' } });

                return;
            }

            const isTxidReported = tronStakingAdapter.isTxidReportedBeforeBroadcast(step);

            if (isTxidReported) {
                const isReported = await reportTronVoteTxId(signResult.txid);

                if (!isReported) {
                    finish({ error: { kind: 'report-failed' } });

                    return;
                }
            }

            const pushResult = await TrezorConnect.pushTransaction({
                tx: signResult.serializedTx,
                coin: asCoinSymbol(account.symbol),
                identity: getAccountIdentity(account),
            });

            if (!pushResult.success) {
                dispatch(
                    transactionsActions.transactionBroadcastStatus({
                        account,
                        flow,
                        status: 'error',
                    }),
                );

                if (isTxidReported) {
                    reportBroadcastFailedAfterTxidReport({
                        step,
                        account,
                        message: pushResult.error.message,
                    });
                }

                finish({
                    error: { kind: 'broadcast-failed', message: pushResult.error.message },
                });

                return;
            }

            const { txid } = pushResult.payload;

            if (isTxidReported && txid !== signResult.txid) {
                reportBroadcastTxidMismatch({ step, account });
            }

            dispatch(
                addFakePendingTronTxThunk({
                    account,
                    txid,
                    fee: precomposedTx.fee ?? '0',
                    ...tronStakingAdapter.getPendingTransaction(step, account, composed.fee),
                }),
            );

            dispatch(notifyEarnTransactionBroadcastThunk({ account, device, txid, flow }));
            finish({ txid });
        } finally {
            onSettled?.();
            dispatch(tronStakeActions.discardTransaction());
        }
    },
);
