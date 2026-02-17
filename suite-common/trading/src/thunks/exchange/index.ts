import { confirmApprovalThunk } from './confirmApprovalThunk';
import { confirmExchangeTradeThunk } from './confirmExchangeTradeThunk';
import { handleExchangeRequestThunk } from './handleExchangeRequestThunk';
import { loadExchangeInfoThunk } from './loadExchangeInfoThunk';
import { selectExchangeQuoteThunk } from './selectExchangeQuoteThunk';
import { sendDexTransactionThunk } from './sendDexTransactionThunk';
import { sendTransactionThunk } from './sendTransactionThunk';
import { signDataAndConfirmThunk } from './signDataAndConfirmThunk';

export const exchangeThunks = {
    loadInfoThunk: loadExchangeInfoThunk,
    handleRequestThunk: handleExchangeRequestThunk,
    selectQuoteThunk: selectExchangeQuoteThunk,
    confirmTradeThunk: confirmExchangeTradeThunk,
    confirmApprovalThunk,
    signDataAndConfirmThunk,
    sendDexTransactionThunk,
    sendTransactionThunk,
};
