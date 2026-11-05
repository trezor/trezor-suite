import { composeExchangeTradeFeeLevelsThunk } from './composeExchangeTradeFeeLevelsThunk';
import { confirmApprovalThunk } from './confirmApprovalThunk';
import { confirmExchangeTradeThunk } from './confirmExchangeTradeThunk';
import { fetchExchangeAllowanceThunk } from './fetchExchangeAllowanceThunk';
import { fetchSelectedProviderQuoteThunk } from './fetchSelectedProviderQuoteThunk';
import { handleExchangeRequestThunk } from './handleExchangeRequestThunk';
import { loadExchangeInfoThunk } from './loadExchangeInfoThunk';
import { prefetchDexQuoteApprovalThunk } from './prefetchDexQuoteApprovalThunk';
import { selectExchangeQuoteThunk } from './selectExchangeQuoteThunk';
import { sendDexTransactionThunk } from './sendDexTransactionThunk';
import { sendTransactionThunk } from './sendTransactionThunk';
import { signDataAndConfirmThunk } from './signDataAndConfirmThunk';
import { watchExchangeApprovalThunk } from './watchExchangeApprovalThunk';

// [typescript-performance]: Keep this explicit type to prevent TypeScript from expanding the
// inferred type in the emitted declaration.
type ExchangeThunks = {
    loadInfoThunk: typeof loadExchangeInfoThunk;
    handleRequestThunk: typeof handleExchangeRequestThunk;
    selectQuoteThunk: typeof selectExchangeQuoteThunk;
    confirmTradeThunk: typeof confirmExchangeTradeThunk;
    fetchSelectedProviderQuoteThunk: typeof fetchSelectedProviderQuoteThunk;
    composeTradeFeeLevelsThunk: typeof composeExchangeTradeFeeLevelsThunk;
    confirmApprovalThunk: typeof confirmApprovalThunk;
    prefetchDexQuoteApprovalThunk: typeof prefetchDexQuoteApprovalThunk;
    signDataAndConfirmThunk: typeof signDataAndConfirmThunk;
    sendDexTransactionThunk: typeof sendDexTransactionThunk;
    sendTransactionThunk: typeof sendTransactionThunk;
    watchExchangeApprovalThunk: typeof watchExchangeApprovalThunk;
    fetchExchangeAllowanceThunk: typeof fetchExchangeAllowanceThunk;
};

export const exchangeThunks: ExchangeThunks = {
    loadInfoThunk: loadExchangeInfoThunk,
    handleRequestThunk: handleExchangeRequestThunk,
    selectQuoteThunk: selectExchangeQuoteThunk,
    confirmTradeThunk: confirmExchangeTradeThunk,
    fetchSelectedProviderQuoteThunk,
    composeTradeFeeLevelsThunk: composeExchangeTradeFeeLevelsThunk,
    confirmApprovalThunk,
    prefetchDexQuoteApprovalThunk,
    signDataAndConfirmThunk,
    sendDexTransactionThunk,
    sendTransactionThunk,
    watchExchangeApprovalThunk,
    fetchExchangeAllowanceThunk,
};
