import { useSelector } from 'react-redux';

import { isCountrySubdivisionEmpty } from '@suite-common/trading';
import { useFormContext, useWatch } from '@suite-native/forms';
import {
    selectIsTradingResidenceCheckEnabled,
    selectTradingResidenceWhitelist,
} from '@suite-native/trading-state';

import { type TradingLocationFormValues } from '../types/tradingLocationForm';

export const useIsTradingAvailableForForm = () => {
    const { control } = useFormContext<TradingLocationFormValues>();
    const isResidenceCheckEnabled = useSelector(selectIsTradingResidenceCheckEnabled);
    const whitelist = useSelector(selectTradingResidenceWhitelist);
    const [country, countrySubdivision] = useWatch({
        control,
        name: ['country', 'countrySubdivision'],
    });
    const countryCode = country?.value;

    if (!isResidenceCheckEnabled) {
        return true;
    }

    return (
        whitelist.has(countryCode) &&
        !isCountrySubdivisionEmpty(countryCode, countrySubdivision?.value)
    );
};
