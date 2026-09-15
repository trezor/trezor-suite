import { type TradingType, selectTradingSendAccount } from '@suite-common/trading';
import { selectAreFeesLoading, selectHasRunningDiscovery } from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { getSelectedCryptoId } from 'src/utils/wallet/trading/tradingTypingUtils';
import { useTradingQuoteAmounts } from 'src/views/wallet/trading/common/hooks/useTradingQuoteAmounts';
import { useTradingSelectedQuote } from 'src/views/wallet/trading/common/hooks/useTradingSelectedQuote';

export const useTradingFormOfferCommon = <T extends TradingType>() => {
    // React Compiler: `watch` keeps one identity for the form's whole life, so a compiled
    // render-time read of it freezes on the first render. Remove once these reads move to
    // `useWatch` or out of render.
    'use no memo';

    const context = useTradingFormContext();
    const {
        form: { state },
        type,
    } = context;
    const account = useSelector(reduxState => selectTradingSendAccount(reduxState, type));

    const areFeesLoading = useSelector(suiteState =>
        selectAreFeesLoading(suiteState, account?.symbol),
    );
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const quote = useTradingSelectedQuote(type as T);
    const quoteAmounts = useTradingQuoteAmounts(quote, type);
    const selectedCryptoId = getSelectedCryptoId(context);

    const selectedAssetCryptoId =
        !state.isLoadingOrInvalid && quoteAmounts?.receiveCurrency
            ? quoteAmounts.receiveCurrency
            : selectedCryptoId;

    const isBaseButtonDisabled =
        isDiscoveryRunning || state.isLoadingOrInvalid || !quote || areFeesLoading;

    return {
        quote,
        quoteAmounts,
        selectedAssetCryptoId,
        isBaseButtonDisabled,
    };
};
