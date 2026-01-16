import { Fragment, useEffect, useState } from 'react';
import { FormattedList } from 'react-intl';

import { FiatCurrencyCode } from 'invity-api';

import { Translation } from '@suite/intl';
import {
    TradingOTC,
    TradingTradeBuySellType,
    cryptoIdToNetworkAndContractAddress,
    invityAPI,
} from '@suite-common/trading';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { TokenAddress } from '@suite-common/wallet-types';
import { localizeNumber } from '@suite-common/wallet-utils';
import { Banner, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { TrezorLink } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { useFiatFromCryptoValue } from 'src/hooks/suite/useFiatFromCryptoValue';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { selectLanguage } from 'src/selectors/suite/suiteSelectors';
import {
    isTradingBuyContext,
    isTradingSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';

export const TradingFormOfferOTC = () => {
    const context = useTradingFormContext<TradingTradeBuySellType>();
    const locale = useSelector(selectLanguage);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const { amountInCrypto } = context.getValues();

    const fiatInput = isTradingBuyContext(context)
        ? context.getValues().fiatInput
        : context.getValues().outputs[0].fiat;

    let fiatCurrency = isTradingBuyContext(context)
        ? context.getValues().currencySelect.value
        : context.getValues().outputs[0].currency.value;
    if (amountInCrypto) {
        fiatCurrency = baseCurrencyCode;
    }

    const cryptoAmount = isTradingBuyContext(context)
        ? context.getValues().cryptoInput
        : context.getValues().outputs[0].amount;

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
    const [otcData, setOtcData] = useState<TradingOTC | null>(null);
    const apiKey = invityAPI.getCurrentApiKey();

    const { fiatAmount: fiatAmountConverted } = useFiatFromCryptoValue({
        amount: cryptoAmount || '0',
        symbol: network?.symbol || 'btc',
        tokenAddress: contractAddress as TokenAddress | undefined,
        rateType: 'current',
    });

    const fiatAmount = amountInCrypto ? fiatAmountConverted : fiatInput;

    useEffect(() => {
        if (!apiKey) return;

        const getOtcData = async () => {
            const otcData = await invityAPI.getOTCData();

            if (!otcData) return;

            setOtcData(otcData);
        };

        getOtcData();
    }, [apiKey]);

    if (!otcData || !otcData.minFiatLimits || !otcData.links || !fiatAmount) {
        return null;
    }

    const minFiatLimit = otcData.minFiatLimits[fiatCurrency.toLowerCase() as FiatCurrencyCode];
    if (!minFiatLimit || Number(fiatAmount) < Number(minFiatLimit)) {
        return null;
    }

    const displayedFiatCurrency = 'eur';
    const displayedFiatLimit = otcData.minFiatLimits[displayedFiatCurrency];
    if (!displayedFiatLimit) {
        return null;
    }

    const links = otcData.links.filter(
        link =>
            countrySelect === 'unknown' ||
            link.allowedCountries.includes(countrySelect.toUpperCase()),
    );

    if (links.length === 0) {
        return null;
    }

    return (
        <Banner
            intent="info"
            description={
                <Text margin={{ bottom: spacings.xxs }}>
                    <Translation
                        id={
                            context.type === 'buy'
                                ? 'TR_TRADING_OTC_INFO_BUY'
                                : 'TR_TRADING_OTC_INFO_SELL'
                        }
                        values={{
                            minimumFiat: localizeNumber(displayedFiatLimit, locale),
                            fiatSymbol: displayedFiatCurrency.toUpperCase(),
                        }}
                    />{' '}
                    <FormattedList
                        type="disjunction"
                        value={links.map((link, index) => (
                            <Fragment key={index}>
                                <TrezorLink href={link.url} target="_blank" typographyStyle="hint">
                                    <Translation
                                        id={
                                            context.type === 'buy'
                                                ? 'TR_TRADING_OTC_LINK_BUY'
                                                : 'TR_TRADING_OTC_LINK_SELL'
                                        }
                                        values={{
                                            providerName: link.name,
                                        }}
                                    />
                                </TrezorLink>
                            </Fragment>
                        ))}
                    />
                </Text>
            }
        />
    );
};
