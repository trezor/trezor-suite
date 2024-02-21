import { useMemo } from 'react';
import { useSelector } from 'src/hooks/suite';
import { buildFiatOption, getDefaultCountry } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { P2pInfo } from 'src/actions/wallet/coinmarketP2pActions';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';

export const useCoinmarketP2pFormDefaultValues = (p2pInfo?: P2pInfo) => {
    const localCurrency = useSelector(selectLocalCurrency);

    const country = p2pInfo?.country;
    const suggestedFiatCurrency = p2pInfo?.suggestedFiatCurrency || localCurrency;

    const defaultCountry = useMemo(() => getDefaultCountry(country), [country]);
    const defaultCurrency = useMemo(
        () => buildFiatOption(suggestedFiatCurrency),
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
