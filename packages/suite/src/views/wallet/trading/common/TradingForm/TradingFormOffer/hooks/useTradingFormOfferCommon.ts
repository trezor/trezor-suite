import type { BuyTrade, ExchangeTrade, SellFiatTrade } from 'invity-api';

import { type TranslationKey } from '@suite/intl';
import { selectTorState } from '@suite/tor';
import { type TradingType, selectTradingProviderCompanyName } from '@suite-common/trading';
import { selectAreFeesLoading, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { type IconName } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { useTradingDeviceDisconnected } from 'src/hooks/wallet/trading/form/common/useTradingDeviceDisconnected';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    getCryptoQuoteAmountProps,
    getSelectedCryptoId,
    getSelectedQuote,
    isTradingExchangeContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import {
    tradingGetAmountLabels,
    tradingGetSectionActionLabel,
} from 'src/utils/wallet/trading/tradingUtils';

type TradingQuoteByType = {
    buy: BuyTrade;
    sell: SellFiatTrade;
    exchange: ExchangeTrade;
};

export const useTradingFormOfferCommon = <T extends TradingType>() => {
    const context = useTradingFormContext();
    const {
        account,
        isAmountEmpty,
        watch,
        form: { state },
        type,
    } = context;

    const { amountInCrypto } = watch();

    const { isTorEnabled } = useSelector(selectTorState);
    const areFeesLoading = useSelector(suiteState =>
        selectAreFeesLoading(suiteState, account.symbol),
    );
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const { tradingDeviceDisconnected } = useTradingDeviceDisconnected();

    const quote = getSelectedQuote(context) as TradingQuoteByType[T] | undefined;
    const quoteAmounts = getCryptoQuoteAmountProps(quote, context);
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
        iconRight?: IconName;
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
        confirmButtonData.iconRight = 'arrowSquareOut';
    } else if (providerName && type === 'sell') {
        confirmButtonData.translationId = 'TR_TRADING_SELL_VIA';
        confirmButtonData.translationValues = { providerName };
        confirmButtonData.iconRight = 'arrowSquareOut';
    }

    const amountLabels = tradingGetAmountLabels({ type, amountInCrypto: !!amountInCrypto });

    const isBaseButtonDisabled =
        isDiscoveryRunning ||
        tradingDeviceDisconnected ||
        state.isLoadingOrInvalid ||
        !quote ||
        areFeesLoading;

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
