import { createThunk } from '@suite-common/redux-utils';
import { getTronStakingRewards } from '@suite-common/staking';
import { type TrezorDevice } from '@suite-common/suite-types';
import { asAmountUnit, getAccountIdentity, unitsToSubunits } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import { BigNumber } from '@trezor/utils';

import { buildClaimContract, buildClaimReviewForm } from './claimContract';
import { type ClaimThunkArguments, composeTronClaimFeeLevelsThunk } from './composeClaim';
import {
    type AddFakePendingTronTxThunkState,
    addFakePendingTronTxThunk,
} from '../../../../transactions/transactionsThunks';
import { TRON_STAKE_MODULE } from '../../shared/constants';
import { signTronContract } from '../../shared/signTronContract';
import { tronStakeActions } from '../../tronStakeReducer';
import { type TronFlow } from '../../tronStakeTypes';

interface SubmitClaimThunkArguments extends ClaimThunkArguments {
    device: TrezorDevice;
    requestPushApproval: () => Promise<boolean>;
    onSigningStart?: () => void;
    onSettled?: () => void;
}

type SubmitTronClaimThunkState = AddFakePendingTronTxThunkState;

export const submitTronClaimThunk = createThunk<
    void,
    SubmitClaimThunkArguments,
    { state: SubmitTronClaimThunkState }
>(
    `${TRON_STAKE_MODULE}/submitTronClaimThunk`,
    async ({ account, device, requestPushApproval, onSigningStart, onSettled }, { dispatch }) => {
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

            const signResult = await signTronContract({ account, device, contract });

            if ('error' in signResult) {
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

            dispatch(tronStakeActions.submitFinished({ accountKey, flow, txid }));
        } finally {
            onSettled?.();
            dispatch(tronStakeActions.discardTransaction());
        }
    },
);
