import { useMemo } from 'react';
import { useSelector } from '@suite-hooks';
import regional from '@wallet-constants/coinmarket/regional';
import { buildOption } from '@wallet-utils/coinmarket/coinmarketUtils';
import { P2pInfo } from '@wallet-actions/coinmarketP2pActions';

export const useCoinmarketP2pFormDefaultValues = (p2pInfo?: P2pInfo) => {
    const { localCurrency } = useSelector(state => ({
        localCurrency: state.wallet.settings.localCurrency,
    }));

    const country = p2pInfo?.country || regional.unknownCountry;
    const suggestedFiatCurrency = p2pInfo?.suggestedFiatCurrency || localCurrency;

    const defaultCountry = useMemo(
        () => ({
            label: regional.countriesMap.get(country),
            value: country,
        }),
        [country],
    );
    const defaultCurrency = useMemo(
        () => buildOption(suggestedFiatCurrency),
        [suggestedFiatCurrency],
    );
    const defaultValues = useMemo(
        () =>
            p2pInfo
                ? {
                      fiatInput: '',
                      currencySelect: defaultCurrency,
                      countrySelect: defaultCountry,
                  }
                : undefined,
        [p2pInfo, defaultCountry, defaultCurrency],
    );

    return { defaultValues, defaultCountry, defaultCurrency };
};
