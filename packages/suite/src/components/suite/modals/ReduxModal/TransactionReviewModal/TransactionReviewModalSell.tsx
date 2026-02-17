import { SendState, StakeState, sendFormActions } from '@suite-common/wallet-core';
import { FormState } from '@suite-common/wallet-types';

import { useDispatch } from 'src/hooks/suite';
import { useTradingSellForm } from 'src/hooks/wallet/trading/form/useTradingSellForm';

import { TransactionReviewModalProps } from './TransactionReviewModal';
import { TransactionReviewModalBody } from './TransactionReviewModalBody';

type TransactionReviewModalSellProps = {
    txInfoState: SendState | StakeState;
    isRbfConfirmedError: boolean;
    cancelSignTx: () => void;
    precomposedForm?: FormState;
} & Pick<TransactionReviewModalProps, 'decision'>;

export const TransactionReviewModalSell = ({
    decision,
    txInfoState,
    cancelSignTx,
    isRbfConfirmedError,
    precomposedForm,
}: TransactionReviewModalSellProps) => {
    const dispatch = useDispatch();
    const tradingSellForm = useTradingSellForm({ pageType: 'retry' });

    const handleTryAgainSignTx = async () => {
        dispatch(sendFormActions.discardTransaction());
        await tradingSellForm.sendTransaction();
    };

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
