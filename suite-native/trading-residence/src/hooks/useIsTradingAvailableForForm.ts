import { useSelector } from 'react-redux';

import { type MessageSystemRootState } from '@suite-common/message-system';
import { useFormContext, useWatch } from '@suite-native/forms';
import { selectIsTradingEnabledForLocation } from '@suite-native/trading-state';

import { type TradingLocationFormValues } from '../types/tradingLocationForm';

export const useIsTradingAvailableForForm = () => {
    const { control } = useFormContext<TradingLocationFormValues>();
    const [country, countrySubdivision] = useWatch({
        control,
        name: ['country', 'countrySubdivision'],
    });

    return useSelector((state: MessageSystemRootState) =>
        selectIsTradingEnabledForLocation(state, country?.value, countrySubdivision?.value),
    );
};
