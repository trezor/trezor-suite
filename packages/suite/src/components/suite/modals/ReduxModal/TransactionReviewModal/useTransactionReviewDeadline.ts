import { useSelector } from 'react-redux';

import {
    selectTradingExchangeSelectedQuote,
    selectTradingExchangeSelectedQuoteTimestamp,
} from '@suite-common/trading';
import { type Account, type FormState } from '@suite-common/wallet-types';

import {
    type TransactionReviewDeadline,
    type TxInfoState,
    getTransactionReviewDeadline,
} from './utils';

type UseTransactionReviewDeadlineParams = {
    account: Pick<Account, 'networkType'> | undefined;
    txInfoState: TxInfoState;
    precomposedForm: FormState | undefined;
};

export const useTransactionReviewDeadline = ({
    account,
    txInfoState,
    precomposedForm,
}: UseTransactionReviewDeadlineParams): TransactionReviewDeadline => {
    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);
    const selectedQuoteTimestamp = useSelector(selectTradingExchangeSelectedQuoteTimestamp);

    return getTransactionReviewDeadline({
        networkType: account?.networkType,
        createdTxTimestamp: txInfoState?.precomposedTx?.createdTimestamp ?? 0,
        isExchange: precomposedForm?.trading?.activeSection === 'exchange',
        selectedQuote,
        selectedQuoteTimestamp,
    });
};
