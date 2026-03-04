import { useCallback } from 'react';

import { useTranslation } from '@suite/intl';
import { TradingCountryOption, regional } from '@suite-common/trading';

export const useGetCountryName = () => {
    const { translationString } = useTranslation();

    const getCountryName = useCallback(
        (country: TradingCountryOption, fullName = false) => {
            if (regional.isWorldwideRegion(country.value)) {
                return translationString('TR_TRADING_COUNTRY_WORLD');
            }

            return fullName ? country.name : country.codeAlpha3;
        },
        [translationString],
    );

    return getCountryName;
};
