import { type TranslationKey } from '@suite/intl';
import { selectIsTorEnabled } from '@suite/tor';
import {
    type TradingType,
    selectTradingProviderCompanyName,
    selectTradingSendAccount,
} from '@suite-common/trading';
import { selectAreFeesLoading, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { type IconComponent } from '@trezor/components';
import { ArrowSquareOutIcon } from '@trezor/icons';

import { useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    getSelectedCryptoId,
    isTradingExchangeContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import {
    tradingGetAmountLabels,
    tradingGetSectionActionLabel,
} from 'src/utils/wallet/trading/tradingUtils';
import { useTradingQuoteAmounts } from 'src/views/wallet/trading/common/hooks/useTradingQuoteAmounts';
import { useTradingSelectedQuote } from 'src/views/wallet/trading/common/hooks/useTradingSelectedQuote';

export const useTradingFormOfferCommon = <T extends TradingType>() => {
    const context = useTradingFormContext();
    const {
        isAmountEmpty,
        watch,
        form: { state },
        type,
    } = context;
    const account = useSelector(reduxState => selectTradingSendAccount(reduxState, type));

    const { amountInCrypto } = watch();

    const isTorEnabled = useSelector(selectIsTorEnabled);
    const areFeesLoading = useSelector(suiteState =>
        selectAreFeesLoading(suiteState, account?.symbol),
    );
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const quote = useTradingSelectedQuote(type as T);
    const quoteAmounts = useTradingQuoteAmounts(quote, type);
    const selectedCryptoId = getSelectedCryptoId(context);

    const sendAmount =
        !state.isLoadingOrInvalid && quoteAmounts?.sendAmount ? quoteAmounts.sendAmount : '0';
    const receiveAmount =
        !state.isLoadingOrInvalid && quoteAmounts?.receiveAmount ? quoteAmounts.receiveAmount : '0';

    const selectedAssetCryptoId =
        !state.isLoadingOrInvalid && quoteAmounts?.receiveCurrency
            ? quoteAmounts.receiveCurrency
            : selectedCryptoId;

    const noOffersWithTor = isTorEnabled && !quote && !state.isFormLoading;
    const isLookingForQuote = state.isFormLoading && !isAmountEmpty;

    const providerName = useSelector(suiteState =>
        selectTradingProviderCompanyName(suiteState, quote?.exchange, type),
    );

    const confirmButtonData: {
        translationId: TranslationKey;
        translationValues?: Record<string, string>;
        iconRight?: IconComponent;
        isLoading: boolean;
    } = {
        translationId: tradingGetSectionActionLabel(type),
        isLoading: areFeesLoading || isLookingForQuote,
    };

    if (isLookingForQuote) {
        confirmButtonData.translationId = 'TR_TRADING_OFFER_LOOKING';
    } else if (providerName && type === 'buy') {
        confirmButtonData.translationId = 'TR_TRADING_BUY_VIA';
        confirmButtonData.translationValues = { providerName };
        confirmButtonData.iconRight = ArrowSquareOutIcon;
    } else if (providerName && type === 'sell') {
        confirmButtonData.translationId = 'TR_TRADING_SELL_VIA';
        confirmButtonData.translationValues = { providerName };
        confirmButtonData.iconRight = ArrowSquareOutIcon;
    }

    const amountLabels = tradingGetAmountLabels({ type, amountInCrypto: !!amountInCrypto });

    const isBaseButtonDisabled =
        isDiscoveryRunning || state.isLoadingOrInvalid || !quote || areFeesLoading;

    return {
        quote,
        quoteAmounts,
        areFeesLoading,
        noOffersWithTor,
        confirmButtonData,
        sendAmount,
        receiveAmount,
        selectedAssetCryptoId,
        amountLabels,
        isBaseButtonDisabled,
        shouldDisplayFiatAmount: isTradingExchangeContext(context) ? false : !!amountInCrypto,
    };
};
