import { type FiatCurrencyCode } from 'invity-api';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { selectLanguage } from '@suite/settings';
import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import {
    type TradingTradeBuySellType,
    cryptoIdToNetworkAndContractAddress,
    getOtcProvidersByCountry,
    useFetchOtc,
} from '@suite-common/trading';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { localizeNumber } from '@suite-common/wallet-utils';
import { Banner, Column, Text } from '@trezor/components';
import { asNetworkSymbol } from '@trezor/network-module';

import { useSelector } from 'src/hooks/suite';
import { useFiatFromCryptoValue } from 'src/hooks/suite/useFiatFromCryptoValue';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    isTradingBuyContext,
    isTradingSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';

const btcSymbol = asNetworkSymbol('btc');

export const TradingFormOfferOTC = () => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const otcQuery = useFetchOtc();
    const { data: otcData, isSuccess } = otcQuery;
    const context = useTradingFormContext<TradingTradeBuySellType>();
    const locale = useSelector(selectLanguage);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const { amountInCrypto } = context.getValues();

    let fiatInput;
    let fiatCurrency;
    let cryptoAmount;
    if (isTradingBuyContext(context)) {
        const buyValues = context.getValues();
        fiatInput = buyValues.fiatInput;
        fiatCurrency = buyValues.currencySelect.value;
        cryptoAmount = buyValues.cryptoInput;
    } else {
        const { outputs } = context.getValues();
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const firstOutput: (typeof outputs)[number] = outputs[0];
        fiatInput = firstOutput.fiat;
        fiatCurrency = firstOutput.currency.value;
        cryptoAmount = firstOutput.amount;
    }
    if (amountInCrypto) {
        fiatCurrency = baseCurrencyCode;
    }

    let cryptoCurrency;
    if (isTradingBuyContext(context)) {
        cryptoCurrency = context.getValues('cryptoSelect').id;
    } else if (isTradingSellContext(context)) {
        cryptoCurrency = context.getValues('sendCryptoSelect')?.id;
    }

    const { network, contractAddress } = cryptoCurrency
        ? cryptoIdToNetworkAndContractAddress(cryptoCurrency)
        : { network: undefined, contractAddress: undefined };

    const countrySelect = context.getValues().countrySelect.value;
    const otcProviders = isSuccess
        ? getOtcProvidersByCountry(otcData, countrySelect || 'unknown')
        : [];

    const { fiatAmount: fiatAmountConverted } = useFiatFromCryptoValue({
        amount: cryptoAmount || '0',
        symbol: network?.symbol || btcSymbol,
        tokenAddress: contractAddress,
        rateType: 'current',
    });

    const fiatAmount = amountInCrypto ? fiatAmountConverted : fiatInput;

    if (!otcData?.minFiatLimits || !otcData.links || !fiatAmount) {
        return null;
    }

    const minFiatLimit = otcData.minFiatLimits[fiatCurrency?.toLowerCase() as FiatCurrencyCode];
    if (!minFiatLimit || Number(fiatAmount) < Number(minFiatLimit)) {
        return null;
    }

    const displayedFiatCurrency = 'eur';
    const displayedFiatLimit = otcData.minFiatLimits[displayedFiatCurrency];
    if (!displayedFiatLimit) {
        return null;
    }

    if (otcProviders?.length === 0) {
        return null;
    }

    const isBuy = context.type === 'buy';

    const handleConciergeClick = () => {
        dispatch(gotoThunk({ routeName: 'wallet-trading-concierge' }));

        analytics.report({
            type: events.tradeNavigateEvent.name,
            payload: {
                action: 'navigate',
                type: 'concierge',
                from: 'otc-banner',
                networkSymbol: network?.symbol,
                contractAddress,
            },
        });
    };

    return (
        <Banner
            intent="info"
            description={
                <Column gap={16}>
                    <Text margin={{ bottom: 4 }}>
                        <Translation
                            id={isBuy ? 'TR_TRADING_OTC_INFO_BUY' : 'TR_TRADING_OTC_INFO_SELL'}
                            values={{
                                minimumFiat: localizeNumber(displayedFiatLimit, locale),
                                fiatSymbol: displayedFiatCurrency.toUpperCase(),
                            }}
                        />
                    </Text>
                    <Banner.Button intent="info" onClick={handleConciergeClick}>
                        <Translation
                            id={isBuy ? 'TR_TRADING_OTC_LINK_BUY' : 'TR_TRADING_OTC_LINK_SELL'}
                        />
                    </Banner.Button>
                </Column>
            }
        />
    );
};
