import { composeExchangeTradeFeeLevelsThunk } from './composeExchangeTradeFeeLevelsThunk';
import { confirmApprovalThunk } from './confirmApprovalThunk';
import { confirmExchangeTradeThunk } from './confirmExchangeTradeThunk';
import { fetchSelectedProviderQuoteThunk } from './fetchSelectedProviderQuoteThunk';
import { handleExchangeRequestThunk } from './handleExchangeRequestThunk';
import { loadExchangeInfoThunk } from './loadExchangeInfoThunk';
import { prefetchDexQuoteApprovalThunk } from './prefetchDexQuoteApprovalThunk';
import { selectExchangeQuoteThunk } from './selectExchangeQuoteThunk';
import { sendDexTransactionThunk } from './sendDexTransactionThunk';
import { sendTransactionThunk } from './sendTransactionThunk';
import { setBridgeSpeedThunk } from './setBridgeSpeedThunk';
import { signDataAndConfirmThunk } from './signDataAndConfirmThunk';
import { watchExchangeApprovalThunk } from './watchExchangeApprovalThunk';

// [typescript-performacetypescript-performace]: Keep this explicit type to prevent TypeScript from expanding the
// inferred type in the emitted declaration.
type ExchangeThunks = {
    loadInfoThunk: typeof loadExchangeInfoThunk;
    handleRequestThunk: typeof handleExchangeRequestThunk;
    selectQuoteThunk: typeof selectExchangeQuoteThunk;
    confirmTradeThunk: typeof confirmExchangeTradeThunk;
    fetchSelectedProviderQuoteThunk: typeof fetchSelectedProviderQuoteThunk;
    setBridgeSpeedThunk: typeof setBridgeSpeedThunk;
    composeTradeFeeLevelsThunk: typeof composeExchangeTradeFeeLevelsThunk;
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
    fetchSelectedProviderQuoteThunk,
    setBridgeSpeedThunk,
    composeTradeFeeLevelsThunk: composeExchangeTradeFeeLevelsThunk,
    confirmApprovalThunk,
    prefetchDexQuoteApprovalThunk,
    signDataAndConfirmThunk,
    sendDexTransactionThunk,
    sendTransactionThunk,
    watchExchangeApprovalThunk,
};
