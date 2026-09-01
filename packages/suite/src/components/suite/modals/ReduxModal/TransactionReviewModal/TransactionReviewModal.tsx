import { selectFullSelectedAccount } from '@suite/account';
import { goto } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';
import {
    cancelSignSendFormTransactionThunk,
    selectPrecomposedSendForm,
    selectSend,
    selectStablecoinYieldTxReview,
    selectStake,
    selectStakePrecomposedForm,
    selectTronStakeTxReview,
    sendFormActions,
    stakeActions,
} from '@suite-common/wallet-core';
import { type FormState, type PrecomposedTransactionFinal } from '@suite-common/wallet-types';

import {
    removeSendFormDraftThunk,
    signAndPushSendFormTransactionThunk,
} from 'src/actions/wallet/send/sendFormThunks';
import { cancelSignYieldTx } from 'src/actions/wallet/stablecoin-yield';
import {
    cancelSignTx as cancelSignStakingTx,
    signTransaction,
} from 'src/actions/wallet/stakeActions';
import { cancelSignTronFreezeTx } from 'src/actions/wallet/tron-stake/cancelSignTronFreezeTx';
import { useSelector } from 'src/hooks/suite';

import { TransactionReviewModalBody } from './TransactionReviewModalBody';
import { TransactionReviewModalExchange } from './TransactionReviewModalExchange';
import { type TransactionReviewModalProps } from './TransactionReviewModalProps';
import { TransactionReviewModalSell } from './TransactionReviewModalSell';
import { type TxInfoState } from './utils';

// This modal is opened either in Device (button request) or User (push tx) context
// contexts are distinguished by `type` prop
export const TransactionReviewModal = ({ type, decision }: TransactionReviewModalProps) => {
    const send = useSelector(selectSend);
    const stake = useSelector(selectStake);
    const yieldTxReview = useSelector(selectStablecoinYieldTxReview);
    const tronStakeTxReview = useSelector(selectTronStakeTxReview);
    const sendPrecomposedForm = useSelector(selectPrecomposedSendForm);
    const stakePrecomposedForm = useSelector(selectStakePrecomposedForm);
    const selectedAccount = useSelector(selectFullSelectedAccount);
    const dispatch = useDispatch();

    const getReviewSource = (): {
        txInfoState: TxInfoState;
        precomposedForm: FormState | undefined;
        cancelSignTx: () => void;
    } => {
        if (tronStakeTxReview.precomposedTx) {
            return {
                txInfoState: tronStakeTxReview,
                precomposedForm: tronStakeTxReview.precomposedForm,
                cancelSignTx: () => dispatch(cancelSignTronFreezeTx()),
            };
        }
        if (yieldTxReview.precomposedTx) {
            return {
                txInfoState: yieldTxReview,
                precomposedForm: yieldTxReview.precomposedForm,
                cancelSignTx: () => dispatch(cancelSignYieldTx()),
            };
        }
        if (send?.precomposedTx) {
            return {
                txInfoState: send,
                precomposedForm: sendPrecomposedForm,
                cancelSignTx: () => dispatch(cancelSignSendFormTransactionThunk()),
            };
        }

        return {
            txInfoState: stake,
            precomposedForm: stakePrecomposedForm,
            cancelSignTx: () => dispatch(cancelSignStakingTx()),
        };
    };

    const { txInfoState, precomposedForm, cancelSignTx } = getReviewSource();

    const isRbfConfirmedError = type === 'review-transaction-rbf-previous-transaction-mined-error';
    const isExchange = precomposedForm?.trading?.activeSection === 'exchange';
    const isSell = precomposedForm?.trading?.activeSection === 'sell';

    const handleSignAndPushSendTx = async () => {
        try {
            const result = await dispatch(
                signAndPushSendFormTransactionThunk({
                    formState: send.precomposedForm!,
                    precomposedTransaction: send.precomposedTx!,
                    selectedAccount: selectedAccount.account,
                }),
            ).unwrap();

            if (result?.success) {
                dispatch(removeSendFormDraftThunk());
                dispatch(goto({ routeName: 'wallet-index', preserveParams: true }));
            }
        } catch {
            // Error state is handled by signAndPushSendFormTransactionThunk.
        }
    };

    const handleStakeTx = async () => {
        dispatch(stakeActions.dispose());
        await dispatch(
            signTransaction(
                stake.precomposedForm!,
                stake.precomposedTx as PrecomposedTransactionFinal,
            ),
        );
    };

    const handleTryAgainSignTx = async () => {
        if (send.precomposedForm && send.precomposedTx) {
            dispatch(sendFormActions.clearSignedTransactionData());
            await handleSignAndPushSendTx();
        } else if (stake.precomposedForm && stake.precomposedTx) {
            await handleStakeTx();
        }
    };

    if (isExchange) {
        return (
            <TransactionReviewModalExchange
                decision={decision}
                txInfoState={txInfoState}
                cancelSignTx={cancelSignTx}
                isRbfConfirmedError={isRbfConfirmedError}
                precomposedForm={precomposedForm}
            />
        );
    }

    if (isSell) {
        return (
            <TransactionReviewModalSell
                decision={decision}
                txInfoState={txInfoState}
                cancelSignTx={cancelSignTx}
                isRbfConfirmedError={isRbfConfirmedError}
                precomposedForm={precomposedForm}
            />
        );
    }

    return (
        <TransactionReviewModalBody
            decision={decision}
            txInfoState={txInfoState}
            tryAgainSignTx={handleTryAgainSignTx}
            cancelSignTx={cancelSignTx}
            isRbfConfirmedError={isRbfConfirmedError}
            precomposedForm={precomposedForm}
        />
    );
};
