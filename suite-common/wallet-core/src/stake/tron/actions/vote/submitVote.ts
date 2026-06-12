import { createThunk } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import { getAccountIdentity } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';

import { type VoteThunkArguments, composeTronVoteFeeLevelsThunk } from './composeVote';
import { buildVoteContract, buildVoteReviewForm, getTotalVotes } from './voteContract';
import { addFakePendingTronTxThunk } from '../../../../transactions/transactionsThunks';
import { TRON_STAKE_MODULE } from '../../shared/constants';
import { signTronContract } from '../../shared/signTronContract';
import { tronStakeActions } from '../../tronStakeReducer';
import { type TronFlow } from '../../tronStakeTypes';

interface SubmitVoteThunkArguments extends VoteThunkArguments {
    device: TrezorDevice;
    flow: TronFlow;
    requestPushApproval: () => Promise<boolean>;
    onSigningStart?: () => void;
    onSettled?: () => void;
}

export const submitTronVoteThunk = createThunk<void, SubmitVoteThunkArguments>(
    `${TRON_STAKE_MODULE}/submitTronVoteThunk`,
    async (
        {
            account,
            device,
            flow,
            representativeAddress,
            requestPushApproval,
            onSigningStart,
            onSettled,
        },
        { dispatch },
    ) => {
        const { key: accountKey } = account;

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

        const contract = buildVoteContract(account, representativeAddress);

        if (!contract) {
            dispatch(
                tronStakeActions.submitFinished({
                    accountKey,
                    flow,
                    error: { kind: 'compose-failed', message: 'Invalid representative address.' },
                }),
            );

            return;
        }

        dispatch(tronStakeActions.submitStarted({ accountKey, flow }));

        try {
            const composed = await dispatch(
                composeTronVoteFeeLevelsThunk({ account, representativeAddress }),
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
                    precomposedForm: buildVoteReviewForm(getTotalVotes(account)),
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
                coin: account.symbol,
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
                    target: { addresses: [representativeAddress], amount: '0' },
                    tronSpecific: {
                        contractType: 'VoteWitnessContract',
                        operation: 'vote',
                        votes: [
                            {
                                address: representativeAddress,
                                count: String(getTotalVotes(account)),
                            },
                        ],
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
