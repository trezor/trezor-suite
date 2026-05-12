import {
    cancelSignSendFormTransactionThunk,
    selectPrecomposedSendForm,
    selectStablecoinYieldTxReview,
    selectStake,
    selectStakePrecomposedForm,
    sendFormActions,
    stakeActions,
} from '@suite-common/wallet-core';
import { type PrecomposedTransactionFinal } from '@suite-common/wallet-types';

import { signAndPushSendFormTransactionThunk } from 'src/actions/wallet/send/sendFormThunks';
import { cancelSignYieldTx } from 'src/actions/wallet/stablecoin-yield';
import {
    cancelSignTx as cancelSignStakingTx,
    signTransaction,
} from 'src/actions/wallet/stakeActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectFullSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

import { TransactionReviewModalBody } from './TransactionReviewModalBody';
import { TransactionReviewModalExchange } from './TransactionReviewModalExchange';
import { type TransactionReviewModalProps } from './TransactionReviewModalProps';
import { TransactionReviewModalSell } from './TransactionReviewModalSell';
import { isStakeState } from './utils';

// This modal is opened either in Device (button request) or User (push tx) context
// contexts are distinguished by `type` prop
export const TransactionReviewModal = ({ type, decision }: TransactionReviewModalProps) => {
    const send = useSelector(state => state.wallet.send);
    const stake = useSelector(selectStake);
    const yieldTxReview = useSelector(selectStablecoinYieldTxReview);
    const selectedAccount = useSelector(selectFullSelectedAccount);
    const dispatch = useDispatch();

    const isYield = Boolean(yieldTxReview.precomposedTx);
    const isSend = !isYield && Boolean(send?.precomposedTx);
    // Only one state should be available when the modal is open
    // eslint-disable-next-line no-nested-ternary
    const txInfoState = isSend ? send : isYield ? yieldTxReview : stake;

    const precomposedForm = useSelector(state => {
        if (isYield) return yieldTxReview.precomposedForm;
        if (isStakeState(txInfoState)) return selectStakePrecomposedForm(state);

        return selectPrecomposedSendForm(state);
    });

    const isRbfConfirmedError = type === 'review-transaction-rbf-previous-transaction-mined-error';
    const isExchange = precomposedForm?.trading?.activeSection === 'exchange';
    const isSell = precomposedForm?.trading?.activeSection === 'sell';

    const handleCancelSignTx = () => {
        if (isSend) {
            dispatch(cancelSignSendFormTransactionThunk());
        } else if (isYield) {
            dispatch(cancelSignYieldTx());
        } else {
            dispatch(cancelSignStakingTx());
        }
    };

    const handleSendTx = async () => {
        await dispatch(
            signAndPushSendFormTransactionThunk({
                formState: send.precomposedForm!,
                precomposedTransaction: send.precomposedTx!,
                selectedAccount: selectedAccount.account,
            }),
        );

        dispatch(sendFormActions.discardTransaction());
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
            await handleSendTx();
        } else if (stake.precomposedForm && stake.precomposedTx) {
            await handleStakeTx();
        }
    };

    if (isExchange) {
        return (
            <TransactionReviewModalExchange
                decision={decision}
                txInfoState={txInfoState}
                cancelSignTx={handleCancelSignTx}
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
                cancelSignTx={handleCancelSignTx}
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
            cancelSignTx={handleCancelSignTx}
            isRbfConfirmedError={isRbfConfirmedError}
            precomposedForm={precomposedForm}
        />
    );
};
