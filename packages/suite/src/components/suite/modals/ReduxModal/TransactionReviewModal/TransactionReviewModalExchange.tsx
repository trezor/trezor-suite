import { SendState, StakeState, sendFormActions } from '@suite-common/wallet-core';
import { FormState, SelectedAccountLoaded } from '@suite-common/wallet-types';

import { useDispatch } from 'src/hooks/suite';
import { useTradingExchangeForm } from 'src/hooks/wallet/trading/form/useTradingExchangeForm';

import { TransactionReviewModalProps } from './TransactionReviewModal';
import { TransactionReviewModalContent } from './TransactionReviewModalContent';

type TransactionReviewModalExchangeProps = {
    selectedAccount: SelectedAccountLoaded;
    txInfoState: SendState | StakeState;
    isRbfConfirmedError: boolean;
    cancelSignTx: () => void;
    precomposedForm?: FormState;
} & Pick<TransactionReviewModalProps, 'decision'>;

export const TransactionReviewModalExchange = ({
    decision,
    selectedAccount,
    txInfoState,
    cancelSignTx,
    isRbfConfirmedError,
    precomposedForm,
}: TransactionReviewModalExchangeProps) => {
    const dispatch = useDispatch();
    const tradingExchangeForm = useTradingExchangeForm({ selectedAccount, pageType: 'retry' });

    const handleTryAgainSignTx = async () => {
        dispatch(sendFormActions.discardTransaction());
        await tradingExchangeForm.sendTransaction();
    };

    return (
        <TransactionReviewModalContent
            decision={decision}
            txInfoState={txInfoState}
            tryAgainSignTx={handleTryAgainSignTx}
            cancelSignTx={cancelSignTx}
            isRbfConfirmedError={isRbfConfirmedError}
            precomposedForm={precomposedForm}
        />
    );
};
