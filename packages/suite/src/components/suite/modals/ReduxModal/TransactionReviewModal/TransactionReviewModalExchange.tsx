import { useState } from 'react';
import { useSelector } from 'react-redux';

import { closeModal } from '@suite/modal';
import {
    type ExchangeIssue,
    hasExpiringProviderTransaction,
    selectTradingExchangeSelectedQuote,
} from '@suite-common/trading';
import { sendFormActions } from '@suite-common/wallet-core';
import { type FormState } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useTradingExchangeTradeActions } from 'src/hooks/wallet/trading/useTradingExchangeTradeActions';

import { TransactionReviewModalBody } from './TransactionReviewModalBody';
import { type TransactionReviewModalProps } from './TransactionReviewModalProps';
import { TransactionReviewModalRefreshedQuoteGate } from './TransactionReviewModalRefreshedQuoteGate';
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
    const { dispatch } = useServices(injectDispatch);
    const { account, refreshSelectedQuote, sendTransaction } = useTradingExchangeTradeActions();
    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);
    const [isRefreshedQuotePendingSign, setIsRefreshedQuotePendingSign] = useState(false);

    const isExpiringProviderTransaction = hasExpiringProviderTransaction(
        selectedQuote,
        account?.networkType,
    );

    if (!precomposedForm) {
        return null;
    }

    const closeWithoutSigning = () => {
        dispatch(closeModal());
        cancelSignTx();
        decision?.resolve(false);
    };

    const handleTryAgainSignTx = async () => {
        if (!isExpiringProviderTransaction) {
            dispatch(sendFormActions.discardTransaction());
            await sendTransaction();

            return;
        }

        // Only the signature goes, the composed transaction stays so this component survives
        // until the refreshed quote is signed; the pending sign flow ends here.
        dispatch(sendFormActions.clearSignedTransactionData());
        decision?.resolve(false);

        const isRefreshed = await refreshSelectedQuote();

        if (!isRefreshed) {
            closeWithoutSigning();

            return;
        }

        setIsRefreshedQuotePendingSign(true);
    };

    const handleRefreshedQuoteSettled = (issue: ExchangeIssue | null) => {
        setIsRefreshedQuotePendingSign(false);

        if (issue) {
            closeWithoutSigning();

            return;
        }

        dispatch(sendFormActions.discardTransaction());
        sendTransaction();
    };

    return (
        <>
            {isRefreshedQuotePendingSign && (
                <TransactionReviewModalRefreshedQuoteGate
                    account={account}
                    onSettled={handleRefreshedQuoteSettled}
                />
            )}
            <TransactionReviewModalBody
                decision={decision}
                txInfoState={txInfoState}
                tryAgainSignTx={handleTryAgainSignTx}
                cancelSignTx={cancelSignTx}
                isRbfConfirmedError={isRbfConfirmedError}
                precomposedForm={precomposedForm}
            />
        </>
    );
};
