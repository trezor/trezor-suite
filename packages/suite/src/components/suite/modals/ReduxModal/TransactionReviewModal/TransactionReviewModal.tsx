import { UserContextPayload } from '@suite-common/suite-types';
import {
    cancelSignSendFormTransactionThunk,
    selectStake,
    sendFormActions,
    stakeActions,
} from '@suite-common/wallet-core';
import { PrecomposedTransactionFinal } from '@suite-common/wallet-types';

import { signAndPushSendFormTransactionThunk } from 'src/actions/wallet/send/sendFormThunks';
import {
    cancelSignTx as cancelSignStakingTx,
    signTransaction,
} from 'src/actions/wallet/stakeActions';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { TransactionReviewModalContent } from './TransactionReviewModalContent';

// This modal is opened either in Device (button request) or User (push tx) context
// contexts are distinguished by `type` prop
type TransactionReviewModalProps =
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

    const handleCancelSignTx = () => {
        if (isSend) {
            dispatch(cancelSignSendFormTransactionThunk());
        } else {
            dispatch(cancelSignStakingTx());
        }
    };

    const handleTryAgainSignTx = async () => {
        if (send.precomposedForm && send.precomposedTx) {
            dispatch(sendFormActions.discardTransaction());
            await dispatch(
                signAndPushSendFormTransactionThunk({
                    formState: send.precomposedForm,
                    precomposedTransaction: send.precomposedTx,
                    selectedAccount: selectedAccount.account,
                }),
            );
        } else if (stake.precomposedForm && stake.precomposedTx) {
            dispatch(stakeActions.dispose());
            await dispatch(
                signTransaction(
                    stake.precomposedForm,
                    stake.precomposedTx as PrecomposedTransactionFinal,
                ),
            );
        }
    };

    return (
        <TransactionReviewModalContent
            decision={decision}
            txInfoState={txInfoState}
            tryAgainSignTx={handleTryAgainSignTx}
            cancelSignTx={handleCancelSignTx}
            isRbfConfirmedError={type === 'review-transaction-rbf-previous-transaction-mined-error'}
        />
    );
};
