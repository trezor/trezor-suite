import { selectSelectedDevice } from '@suite-common/device';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type ComposeYieldEvmTransactionThunkState,
    type LidoTransactionData,
    type LidoTransactionKind,
    type YieldFlowDisplayToken,
    type YieldFlowType,
    composeYieldEvmTransactionThunk,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { createThunk } from '@trezor/redux-utils';

import {
    type SendYieldTransactionDeps,
    type SendYieldTransactionState,
    getYieldDeviceErrorMessage,
    openYieldSimulationThunk,
    sendYieldTransaction,
} from '../stablecoin-yield/signingHelpers';

const LIDO_PREFIX = '@wallet/lido';

// The fee modal and the review modal belong to the yield flows; a Lido transaction rides them as
// the yield flow it resembles until the staking engine drives its own review.
const YIELD_FLOW_TYPE_BY_KIND: Record<
    LidoTransactionKind,
    Extract<YieldFlowType, 'deposit' | 'withdraw'>
> = {
    stake: 'deposit',
    approve: 'withdraw',
    'request-withdrawal': 'withdraw',
    claim: 'withdraw',
};

// The review and the pending history entry show their amount as sent. An approval moves nothing
// and a claim only receives, so neither has an amount to show there.
const SENDS_AMOUNT_BY_KIND: Record<LidoTransactionKind, boolean> = {
    stake: true,
    approve: false,
    'request-withdrawal': true,
    claim: false,
};

type SubmitLidoTransactionPayload = {
    account: Account;
    kind: LidoTransactionKind;
    transaction: LidoTransactionData;
    // What the flow stakes, approves, unstakes or claims, in whole units of the token.
    amount: string;
    token: YieldFlowDisplayToken;
};

export type SubmitLidoTransactionResult = {
    txid: string;
    fee: string;
};

export type SubmitLidoTransactionThunkState = ComposeYieldEvmTransactionThunkState &
    SendYieldTransactionState;

export type SubmitLidoTransactionThunkDeps = SendYieldTransactionDeps;

/**
 * Composes, signs and broadcasts one Lido transaction. Resolves with nothing when the user backs
 * out or the transaction fails, which a toast then reports.
 */
export const submitLidoTransactionThunk = createThunk<
    SubmitLidoTransactionResult | undefined,
    SubmitLidoTransactionPayload,
    { state: SubmitLidoTransactionThunkState; extra: SubmitLidoTransactionThunkDeps }
>(
    `${LIDO_PREFIX}/submitTransaction`,
    async ({ account, kind, transaction, amount, token }, { dispatch, getState }) => {
        const flowType = YIELD_FLOW_TYPE_BY_KIND[kind];
        const device = selectSelectedDevice(getState());

        try {
            const composed = await dispatch(
                composeYieldEvmTransactionThunk({ account, ...transaction }),
            ).unwrap();

            if (composed.type === 'error') {
                dispatch(
                    notificationsActions.addToast({
                        type: 'sign-tx-error',
                        error: `Failed to compose the Lido transaction (${composed.reason}).`,
                    }),
                );

                return undefined;
            }

            const feeSelection = await dispatch(
                openYieldSimulationThunk(
                    { flow: flowType, unsignedTx: composed.unsignedTransaction, account },
                    device,
                ),
            );

            if (feeSelection === undefined || feeSelection.value === false) {
                return undefined;
            }

            const sendResult = await sendYieldTransaction({
                account,
                amount: SENDS_AMOUNT_BY_KIND[kind] ? amount : '0',
                token,
                unsignedTransaction: composed.unsignedTransaction,
                flowKey: `lido-${kind}`,
                flowType,
                dispatch,
                getState,
                selectedFee: feeSelection.selectedFee,
                selectedFeeLevel: feeSelection.selectedFeeLevel,
            });

            feeSelection.resolve();

            if (sendResult.status === 'cancelled') {
                return undefined;
            }

            return { txid: sendResult.txid, fee: sendResult.fee };
        } catch (error) {
            console.error(error);
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error:
                        getYieldDeviceErrorMessage(error) ??
                        (error instanceof Error ? error.message : String(error)),
                }),
            );

            return undefined;
        }
    },
);
