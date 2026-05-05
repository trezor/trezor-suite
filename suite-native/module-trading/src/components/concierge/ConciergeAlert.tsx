import { type FiatCurrencyCode } from 'invity-api';

import {
    type TradingCountryOption,
    getOtcProvidersByCountry,
    useFetchOtc,
} from '@suite-common/trading';
import { FullAlertBox } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';

import { useTradingTabs } from '../../hooks/general/useTradingTabs';
import { CRYPTO_MAX_FORM_TYPE } from '../../utils/buy/buyFormValidationSchema';

type Props = {
    tradingType: 'buy' | 'sell';
};

type ConciergeFormValues = {
    fiatCurrency: FiatCurrencyCode;
    fiatValue?: string;
    fiatStringAmount?: string;
    country: TradingCountryOption;
    cryptoValue?: string;
};

const getConciergeFiatAmount = ({
    tradingType,
    values,
}: {
    tradingType: Props['tradingType'];
    values: ConciergeFormValues;
}) => (tradingType === 'buy' ? values.fiatValue : values.fiatStringAmount);

export const ConciergeAlert = ({ tradingType }: Props) => {
    const { setActiveTab } = useTradingTabs();
    const { data } = useFetchOtc();

    const {
        getValues,
        formState: { errors },
    } = useFormContext<ConciergeFormValues>();
    const formValues = getValues();

    const fiatAmount = getConciergeFiatAmount({ tradingType, values: formValues });

    const fiatLimit = data?.minFiatLimits?.[formValues.fiatCurrency];
    const isFiatAmountDefined = fiatAmount !== undefined && fiatAmount !== '';

    const otcProviders = getOtcProvidersByCountry(data, formValues?.country?.value);

    const isConciergeAvailable =
        (otcProviders.length > 0 &&
            fiatLimit !== undefined &&
            isFiatAmountDefined &&
            Number(fiatAmount) >= fiatLimit) ||
        (otcProviders.length > 0 && errors.cryptoValue?.type === CRYPTO_MAX_FORM_TYPE);

    const alertTitle =
        tradingType === 'buy' ? (
            <Translation id="moduleTrading.tradingScreen.concierge.alert.labelBuy" />
        ) : (
            <Translation id="moduleTrading.tradingScreen.concierge.alert.labelSell" />
        );

    const ctaLabel =
        tradingType === 'buy' ? (
            <Translation id="moduleTrading.tradingScreen.concierge.alert.ctaBuy" />
        ) : (
            <Translation id="moduleTrading.tradingScreen.concierge.alert.ctaSell" />
        );

    const handlePressCta = () => {
        setActiveTab('concierge');
    };

    if (!isConciergeAvailable) {
        return null;
    }

    return (
        <FullAlertBox
            iconName="handshake"
            title={alertTitle}
            variant="info"
            primaryButtonLabel={ctaLabel}
            onPressPrimaryButton={handlePressCta}
        />
    );
};
