import { sendFormActions } from '@suite-common/wallet-core';
import { type FormState } from '@suite-common/wallet-types';

import { useDispatch } from 'src/hooks/suite';
import { useTradingSellForm } from 'src/hooks/wallet/trading/form/useTradingSellForm';

import { TransactionReviewModalBody } from './TransactionReviewModalBody';
import { type TransactionReviewModalProps } from './TransactionReviewModalProps';
import { type TxInfoState } from './utils';

type TransactionReviewModalSellProps = {
    txInfoState: TxInfoState;
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
