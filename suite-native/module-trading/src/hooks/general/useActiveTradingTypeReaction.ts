import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { type TradingStackParamList, type TradingStackRoutes } from '@suite-native/navigation';
import { selectEnabledTradingTypes, tradingActions } from '@suite-native/trading-state';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

export const useActiveTradingTypeReaction = () => {
    const { dispatch } = useServices(injectDispatch);
    const enabledTradingTypes = useSelector(selectEnabledTradingTypes);
    const { params } = useRoute<RouteProp<TradingStackParamList, TradingStackRoutes.Trading>>();
    const tradingType = params?.tradingType;

    useEffect(() => {
        const activeTradingType =
            tradingType && enabledTradingTypes.includes(tradingType)
                ? tradingType
                : (enabledTradingTypes[0] ?? 'buy');

        dispatch(tradingActions.setActiveTradingType(activeTradingType));

        return () => {
            dispatch(tradingActions.clearActiveTradingType());
        };
    }, [enabledTradingTypes, dispatch, tradingType]);
};
