import { useIsFocused } from '@react-navigation/native';

import {
    type TradingType,
    useProviderMetadataChangeEffect as useCommonProviderMetadataChangeEffect,
} from '@suite-common/trading';
import { type Control, type FieldValues, type Path, useWatch } from '@suite-native/forms';

export const useProviderMetadataChangeEffect = <TFieldValues extends FieldValues>(
    control: Control<TFieldValues>,
    tradingType: TradingType,
) => {
    const exchange = useWatch({
        control,
        name: 'quote.exchange' as Path<TFieldValues>,
    }) as string | undefined;
    const isFocused = useIsFocused();

    return useCommonProviderMetadataChangeEffect(tradingType, exchange, isFocused);
};
