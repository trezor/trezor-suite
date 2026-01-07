import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    type TradingRootState,
    TradingType,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { selectTradingProviderMetadata, tradingActions } from '@suite-native/trading-state';

export type QuoteProviderFormWatch = (key: 'quote.exchange') => string | undefined;

export const useProviderMetadataChangeEffect = (
    watch: QuoteProviderFormWatch,
    tradingType: TradingType,
) => {
    const dispatch = useDispatch();
    const exchange = watch('quote.exchange');

    const providerMetadata = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, exchange, tradingType),
    );
    const currentProviderMetadata = useSelector(selectTradingProviderMetadata);

    useEffect(() => {
        if (providerMetadata !== currentProviderMetadata) {
            dispatch(tradingActions.setCurrentProviderMetadata(providerMetadata));
        }
    }, [providerMetadata, currentProviderMetadata, dispatch]);

    useEffect(
        () => () => {
            dispatch(tradingActions.setCurrentProviderMetadata(undefined));
        },
        [dispatch],
    );

    return currentProviderMetadata;
};
