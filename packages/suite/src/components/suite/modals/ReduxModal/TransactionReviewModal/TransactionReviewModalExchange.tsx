import { useDispatch } from 'react-redux';

import { sendFormActions } from '@suite-common/wallet-core';
import { type FormState } from '@suite-common/wallet-types';

import { useTradingExchangeTradeActions } from 'src/hooks/wallet/trading/useTradingExchangeTradeActions';

import { TransactionReviewModalBody } from './TransactionReviewModalBody';
import { type TransactionReviewModalProps } from './TransactionReviewModalProps';
import { type TxInfoState } from './utils';

type TransactionReviewModalExchangeProps = {
    txInfoState: TxInfoState;
    isRbfConfirmedError: boolean;
    cancelSignTx: () => void;
    precomposedForm?: FormState;
} & Pick<TransactionReviewModalProps, 'decision'>;

export const TransactionReviewModalExchange = ({
    decision,
    txInfoState,
    cancelSignTx,
    isRbfConfirmedError,
    precomposedForm,
}: TransactionReviewModalExchangeProps) => {
    const dispatch = useDispatch();
    const { sendTransaction } = useTradingExchangeTradeActions();

    if (!precomposedForm) {
        return null;
    }

    const handleTryAgainSignTx = async () => {
        dispatch(sendFormActions.discardTransaction());
        await sendTransaction();
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
