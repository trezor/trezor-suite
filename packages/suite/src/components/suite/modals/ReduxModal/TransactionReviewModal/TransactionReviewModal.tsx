import { UserContextPayload } from '@suite-common/suite-types';
import { selectStake } from '@suite-common/wallet-core';
import { cancelSignTx as cancelSignStakingTx } from 'src/actions/wallet/stakeActions';
import { TransactionReviewModalContent } from './TransactionReviewModalContent';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { cancelSignSendFormTransactionThunk } from 'src/actions/wallet/send/sendFormThunks';

// This modal is opened either in Device (button request) or User (push tx) context
// contexts are distinguished by `type` prop
type TransactionReviewModalProps =
    | Extract<UserContextPayload, { type: 'review-transaction' }>
    | { type: 'sign-transaction'; decision?: undefined };

export const TransactionReviewModal = ({ decision }: TransactionReviewModalProps) => {
    const send = useSelector(state => state.wallet.send);
    const stake = useSelector(selectStake);
    const dispatch = useDispatch();

    const isSend = Boolean(send?.precomposedTx);
    // Only one state should be available when the modal is open
    const txInfoState = isSend ? send : stake;

    const handleCancelSignTx = () => {
        if (isSend) dispatch(cancelSignSendFormTransactionThunk());
        else dispatch(cancelSignStakingTx());
    };

    return (
        <TransactionReviewModalContent
            decision={decision}
            txInfoState={txInfoState}
            cancelSignTx={handleCancelSignTx}
        />
    );
};
