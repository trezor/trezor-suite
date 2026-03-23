import { type UserContextPayload } from '@suite-common/suite-types';
import {
    cancelSignSendFormTransactionThunk,
    selectPrecomposedSendForm,
    selectStake,
    selectStakePrecomposedForm,
    sendFormActions,
    stakeActions,
} from '@suite-common/wallet-core';
import { type PrecomposedTransactionFinal } from '@suite-common/wallet-types';

import { signAndPushSendFormTransactionThunk } from 'src/actions/wallet/send/sendFormThunks';
import {
    cancelSignTx as cancelSignStakingTx,
    signTransaction,
} from 'src/actions/wallet/stakeActions';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { TransactionReviewModalBody } from './TransactionReviewModalBody';
import { TransactionReviewModalExchange } from './TransactionReviewModalExchange';
import { TransactionReviewModalSell } from './TransactionReviewModalSell';
import { isStakeState } from './types';

// This modal is opened either in Device (button request) or User (push tx) context
// contexts are distinguished by `type` prop
export type TransactionReviewModalProps =
    | Extract<UserContextPayload, { type: 'review-transaction' }>
    | { type: 'sign-transaction'; decision?: undefined }
    | Extract<
          UserContextPayload,
          { type: 'review-transaction-rbf-previous-transaction-mined-error' }
      >;

export const TransactionReviewModal = ({ type, decision }: TransactionReviewModalProps) => {
    const send = useSelector(state => state.wallet.send);
    const stake = useSelector(selectStake);
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const dispatch = useDispatch();

    const isSend = Boolean(send?.precomposedTx);
    // Only one state should be available when the modal is open
    const txInfoState = isSend ? send : stake;

    const precomposedForm = useSelector(state =>
        isStakeState(txInfoState)
            ? selectStakePrecomposedForm(state)
            : selectPrecomposedSendForm(state),
    );

    const isRbfConfirmedError = type === 'review-transaction-rbf-previous-transaction-mined-error';
    const isExchange = precomposedForm?.trading?.activeSection === 'exchange';
    const isSell = precomposedForm?.trading?.activeSection === 'sell';

    const handleCancelSignTx = () => {
        if (isSend) {
            dispatch(cancelSignSendFormTransactionThunk());
        } else {
            dispatch(cancelSignStakingTx());
        }
    };

    const handleSendTx = async () => {
        dispatch(sendFormActions.discardTransaction());

        await dispatch(
            signAndPushSendFormTransactionThunk({
                formState: send.precomposedForm!,
                precomposedTransaction: send.precomposedTx!,
                selectedAccount: selectedAccount.account,
            }),
        );
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
