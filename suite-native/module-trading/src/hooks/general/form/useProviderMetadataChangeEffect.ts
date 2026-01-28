import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useIsFocused } from '@react-navigation/native';

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
    const isFocused = useIsFocused();

    const providerMetadata = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, exchange, tradingType),
    );
    const currentProviderMetadata = useSelector(selectTradingProviderMetadata);

    useEffect(() => {
        // On navigation to preview screen the form is cleared, but we want to keep this value, therefore
        // we skip updates to currentProviderMetadata.
        // The effect will clear the provider metadata as soon as user goes back to form screen.
        if (!isFocused) {
            return;
        }

        if (providerMetadata === currentProviderMetadata) {
            return;
        }

        dispatch(tradingActions.setCurrentProviderMetadata(providerMetadata));
    }, [providerMetadata, currentProviderMetadata, dispatch, isFocused]);

    useEffect(
        () => () => {
            dispatch(tradingActions.setCurrentProviderMetadata(undefined));
        },
        [dispatch],
    );

    return currentProviderMetadata;
};
