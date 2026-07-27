import { confirmApprovalThunk } from './confirmApprovalThunk';
import { confirmExchangeTradeThunk } from './confirmExchangeTradeThunk';
import { handleExchangeRequestThunk } from './handleExchangeRequestThunk';
import { loadExchangeInfoThunk } from './loadExchangeInfoThunk';
import { prefetchDexQuoteApprovalThunk } from './prefetchDexQuoteApprovalThunk';
import { selectExchangeQuoteThunk } from './selectExchangeQuoteThunk';
import { sendDexTransactionThunk } from './sendDexTransactionThunk';
import { sendTransactionThunk } from './sendTransactionThunk';
import { signDataAndConfirmThunk } from './signDataAndConfirmThunk';
import { watchExchangeApprovalThunk } from './watchExchangeApprovalThunk';

// [typescript-performace]: Keep this explicit type to prevent TypeScript from expanding the
// inferred type in the emitted declaration.
type ExchangeThunks = {
    loadInfoThunk: typeof loadExchangeInfoThunk;
    handleRequestThunk: typeof handleExchangeRequestThunk;
    selectQuoteThunk: typeof selectExchangeQuoteThunk;
    confirmTradeThunk: typeof confirmExchangeTradeThunk;
    confirmApprovalThunk: typeof confirmApprovalThunk;
    prefetchDexQuoteApprovalThunk: typeof prefetchDexQuoteApprovalThunk;
    signDataAndConfirmThunk: typeof signDataAndConfirmThunk;
    sendDexTransactionThunk: typeof sendDexTransactionThunk;
    sendTransactionThunk: typeof sendTransactionThunk;
    watchExchangeApprovalThunk: typeof watchExchangeApprovalThunk;
};

export const exchangeThunks: ExchangeThunks = {
    loadInfoThunk: loadExchangeInfoThunk,
    handleRequestThunk: handleExchangeRequestThunk,
    selectQuoteThunk: selectExchangeQuoteThunk,
    confirmTradeThunk: confirmExchangeTradeThunk,
    confirmApprovalThunk,
    prefetchDexQuoteApprovalThunk,
    signDataAndConfirmThunk,
    sendDexTransactionThunk,
    sendTransactionThunk,
    watchExchangeApprovalThunk,
};
