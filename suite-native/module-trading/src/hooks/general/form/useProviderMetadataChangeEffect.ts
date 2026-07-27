import { useIsFocused } from '@react-navigation/native';

import {
    type TradingType,
    useProviderMetadataChangeEffect as useCommonProviderMetadataChangeEffect,
} from '@suite-common/trading';

export type QuoteProviderFormWatch = (key: 'quote.exchange') => string | undefined;

export const useProviderMetadataChangeEffect = (
    watch: QuoteProviderFormWatch,
    tradingType: TradingType,
) => {
    const exchange = watch('quote.exchange');
    const isFocused = useIsFocused();

    return useCommonProviderMetadataChangeEffect(tradingType, exchange, isFocused);
};
