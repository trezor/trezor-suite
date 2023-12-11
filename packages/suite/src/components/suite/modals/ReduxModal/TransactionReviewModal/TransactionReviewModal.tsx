import { UserContextPayload } from '@suite-common/suite-types';
import { selectStake } from '@suite-common/wallet-core';
import { useSelector } from 'src/hooks/suite';
import { cancelSignTx as cancelSignSendTx } from 'src/actions/wallet/sendFormActions';
import { cancelSignTx as cancelSignStakingTx } from 'src/actions/wallet/stakeActions';
import { TransactionReviewModalContent } from './TransactionReviewModalContent';

// This modal is opened either in Device (button request) or User (push tx) context
// contexts are distinguished by `type` prop
type TransactionReviewModalProps =
    | Extract<UserContextPayload, { type: 'review-transaction' }>
    | { type: 'sign-transaction'; decision?: undefined };

export const TransactionReviewModal = ({ decision }: TransactionReviewModalProps) => {
    const send = useSelector(state => state.wallet.send);
    const stake = useSelector(selectStake);

    const isSend = Boolean(send?.precomposedTx);
    // Only one state should be available when the modal is open
    const txInfoState = isSend ? send : stake;
    const cancelSignTx = isSend ? cancelSignSendTx : cancelSignStakingTx;

    return (
        <TransactionReviewModalContent
            decision={decision}
            txInfoState={txInfoState}
            cancelSignTx={cancelSignTx}
        />
    );
};
