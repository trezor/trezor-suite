import { createThunk } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import { getNetwork } from '@suite-common/wallet-config';
import { asAmountUnit, getAccountIdentity, unitsToSubunits } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import { BigNumber } from '@trezor/utils';

import { type FreezeThunkArguments, composeTronFreezeFeeLevelsThunk } from './composeFreeze';
import { buildFreezeContract, buildFreezeReviewForm } from './freezeContract';
import { addFakePendingTronTxThunk } from '../../../../transactions/transactionsThunks';
import { TRON_STAKE_MODULE } from '../../shared/constants';
import { signTronContract } from '../../shared/signTronContract';
import { tronStakeActions } from '../../tronStakeReducer';
import { type TronFlow } from '../../tronStakeTypes';

interface SubmitFreezeThunkArguments extends FreezeThunkArguments {
    device: TrezorDevice;
    requestPushApproval: () => Promise<boolean>;
    onSigningStart?: () => void;
    onSettled?: () => void;
}

export const submitTronFreezeThunk = createThunk<void, SubmitFreezeThunkArguments>(
    `${TRON_STAKE_MODULE}/submitTronFreezeThunk`,
    async (
        { account, device, amount, resourceType, requestPushApproval, onSigningStart, onSettled },
        { dispatch },
    ) => {
        const { key: accountKey } = account;
        const flow: TronFlow = 'stake';

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

        const contract = buildFreezeContract(account, amount, resourceType);

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
            const composed = await dispatch(
                composeTronFreezeFeeLevelsThunk({ account, amount, resourceType }),
            )
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
                    precomposedForm: buildFreezeReviewForm(resourceType),
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

            const stakeAmount = unitsToSubunits({
                value: asAmountUnit(new BigNumber(amount)),
                decimals: getNetwork(account.symbol).decimals,
            }).toString();

            dispatch(
                addFakePendingTronTxThunk({
                    account,
                    txid,
                    amount: '0',
                    fee: precomposedTx.fee ?? '0',
                    type: 'self',
                    target: { addresses: [account.descriptor], amount: stakeAmount },
                    tronSpecific: {
                        contractType: 'FreezeBalanceV2Contract',
                        operation: 'freeze',
                        resource: resourceType === 'energy' ? 'ENERGY' : 'BANDWIDTH',
                        stakeAmount,
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
