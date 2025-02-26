import { useEffect, useState } from 'react';

import { FiatCurrencyCode } from 'invity-api';

import { TradingOTC, TradingTradeBuySellType, invityAPI } from '@suite-common/trading';
import { localizeNumber } from '@suite-common/wallet-utils';
import { Banner, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation, TrezorLink } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';
import { isTradingBuyContext } from 'src/utils/wallet/trading/tradingTypingUtils';

export const TradingFormOfferOTC = () => {
    const context = useTradingFormContext<TradingTradeBuySellType>();
    const locale = useSelector(selectLanguage);

    const { amountInCrypto } = context.getValues();
    const fiatAmount = isTradingBuyContext(context)
        ? context.getValues().fiatInput
        : context.getValues().outputs[0].fiat;
    const currencySelect = isTradingBuyContext(context)
        ? context.getValues().currencySelect.value
        : context.getValues().outputs[0].currency.value;
    const [otcData, setOtcData] = useState<TradingOTC | null>(null);
    const apiKey = invityAPI.getCurrentApiKey();

    useEffect(() => {
        if (!apiKey) return;

        const getOtcData = async () => {
            const otcData = await invityAPI.getOTCData();

            if (!otcData) return;

            setOtcData(otcData);
        };

        getOtcData();
    }, [apiKey]);

    const isCurrencyAllowed = otcData?.allowedCurrencies?.includes(
        currencySelect as FiatCurrencyCode,
    );

    if (
        !otcData ||
        amountInCrypto ||
        !isCurrencyAllowed ||
        !fiatAmount ||
        Number(fiatAmount) <= Number(otcData.minimumFiat)
    ) {
        return null;
    }

    const apiUrl = new URL(otcData.apiUrl);
    const params = new URLSearchParams({
        widget_id: otcData.idWidget,
        otc_id: otcData.idOtcUser,
        fiat_amount: fiatAmount,
        fiat_currency: currencySelect,
        type: context.type,
    });

    apiUrl.search = params.toString();

    return (
        <Banner variant="info">
            <Text margin={{ bottom: spacings.xxs }}>
                <Translation
                    id={
                        context.type === 'buy'
                            ? 'TR_TRADING_OTC_INFO_BUY'
                            : 'TR_TRADING_OTC_INFO_SELL'
                    }
                    values={{
                        minimumFiat: localizeNumber(otcData.minimumFiat, locale),
                        fiatSymbol: currencySelect.toUpperCase(),
                    }}
                />{' '}
                <TrezorLink href={apiUrl.toString()} target="_blank" typographyStyle="hint">
                    <Translation
                        id={
                            context.type === 'buy'
                                ? 'TR_TRADING_OTC_LINK_BUY'
                                : 'TR_TRADING_OTC_LINK_SELL'
                        }
                    />
                </TrezorLink>
            </Text>
        </Banner>
    );
};
