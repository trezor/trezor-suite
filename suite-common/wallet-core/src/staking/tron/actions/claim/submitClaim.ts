import { type AnalyticsDep, events } from '@suite-common/analytics';
import { type TrezorDevice } from '@suite-common/suite-types';
import { asAmountUnit, getAccountIdentity, unitsToSubunits } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import { type WithServices, createThunk } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import { buildClaimContract, buildClaimReviewForm } from './claimContract';
import { type ClaimThunkArguments, composeTronClaimFeeLevelsThunk } from './composeClaim';
import { notifyEarnTransactionBroadcastThunk } from '../../../../earn/earnTransactionsThunks';
import {
    type AddFakePendingTronTxThunkState,
    addFakePendingTronTxThunk,
} from '../../../../transactions/transactionsThunks';
import { TRON_STAKE_MODULE } from '../../shared/constants';
import { signTronContract } from '../../shared/signTronContract';
import { tronStakeActions } from '../../tronStakingReducer';
import { type TronFlow } from '../../tronStakingTypes';
import { getTronStakingRewards } from '../../tronStakingUtils';

interface SubmitClaimThunkArguments extends ClaimThunkArguments {
    device: TrezorDevice;
    requestPushApproval: () => Promise<boolean>;
    onSigningStart?: () => void;
    onSettled?: () => void;
}

type SubmitTronClaimThunkState = AddFakePendingTronTxThunkState;

type SubmitTronClaimThunkDeps = WithServices<AnalyticsDep>;

export const submitTronClaimThunk = createThunk<
    void,
    SubmitClaimThunkArguments,
    { state: SubmitTronClaimThunkState; extra: SubmitTronClaimThunkDeps }
>(
    `${TRON_STAKE_MODULE}/submitTronClaimThunk`,
    async (
        { account, device, requestPushApproval, onSigningStart, onSettled },
        { dispatch, extra },
    ) => {
        const { key: accountKey } = account;
        const flow: TronFlow = 'claim';

        if (account.networkType !== 'tron') {
            dispatch(
                tronStakeActions.submitFinished({
                    accountKey,
                    flow,
                    error: { kind: 'compose-failed', message: 'Invalid network type.' },
                }),
            );

            return;
        }

        const contract = buildClaimContract(account);

        if (!contract) {
            dispatch(
                tronStakeActions.submitFinished({
                    accountKey,
                    flow,
                    error: { kind: 'compose-failed', message: 'Invalid owner address.' },
                }),
            );

            return;
        }

        dispatch(tronStakeActions.submitStarted({ accountKey, flow }));

        try {
            const composed = await dispatch(composeTronClaimFeeLevelsThunk({ account }))
                .unwrap()
                .catch(() => undefined);
            const precomposedTx = composed?.normal?.type === 'final' ? composed.normal : undefined;

            if (!precomposedTx) {
                dispatch(
                    tronStakeActions.submitFinished({
                        accountKey,
                        flow,
                        error: { kind: 'compose-failed' },
                    }),
                );

                return;
            }

            dispatch(
                tronStakeActions.storePrecomposedTransaction({
                    precomposedTx,
                    precomposedForm: buildClaimReviewForm(),
                    accountKey,
                }),
            );

            onSigningStart?.();

            const signResult = await signTronContract({
                account,
                device,
                contract,
            });

            if ('error' in signResult) {
                if (signResult.error.kind === 'cancelled') {
                    extra.services.analytics.report({
                        type: events.transactionCancelEvent.name,
                        payload: {
                            txType: 'stake',
                            networkSymbol: account.symbol,
                            stage: 'signing',
                        },
                    });
                }

                dispatch(
                    tronStakeActions.submitFinished({ accountKey, flow, error: signResult.error }),
                );

                return;
            }

            dispatch(
                tronStakeActions.storeSignedTransaction({
                    serializedTx: { tx: signResult.serializedTx, symbol: account.symbol },
                }),
            );

            const isPushApproved = await requestPushApproval();

            if (!isPushApproved) {
                extra.services.analytics.report({
                    type: events.transactionCancelEvent.name,
                    payload: { txType: 'stake', networkSymbol: account.symbol, stage: 'review' },
                });
                dispatch(
                    tronStakeActions.submitFinished({
                        accountKey,
                        flow,
                        error: { kind: 'cancelled' },
                    }),
                );

                return;
            }

            const pushResult = await TrezorConnect.pushTransaction({
                tx: signResult.serializedTx,
                coin: asCoinSymbol(account.symbol),
                identity: getAccountIdentity(account),
            });

            if (!pushResult.success) {
                dispatch(
                    tronStakeActions.submitFinished({
                        accountKey,
                        flow,
                        error: { kind: 'broadcast-failed', message: pushResult.error.message },
                    }),
                );

                return;
            }

            const { txid } = pushResult.payload;

            dispatch(
                addFakePendingTronTxThunk({
                    account,
                    txid,
                    amount: '0',
                    fee: precomposedTx.fee ?? '0',
                    type: 'self',
                    target: {
                        addresses: [account.descriptor],
                        amount: unitsToSubunits({
                            value: asAmountUnit(new BigNumber(getTronStakingRewards(account))),
                            symbol: account.symbol,
                        }).toString(),
                    },
                    tronSpecific: {
                        contractType: 'WithdrawBalanceContract',
                        operation: 'claim',
                        bandwidthUsage: new BigNumber(precomposedTx.fee).isZero()
                            ? String(precomposedTx.bytes)
                            : undefined,
                    },
                }),
            );

            dispatch(notifyEarnTransactionBroadcastThunk({ account, device, txid, flow }));
            dispatch(tronStakeActions.submitFinished({ accountKey, flow, txid }));
        } finally {
            onSettled?.();
            dispatch(tronStakeActions.discardTransaction());
        }
    },
);
