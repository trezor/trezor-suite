import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { type TradingType } from '@suite-common/trading';
import { type TradingStackParamList, type TradingStackRoutes } from '@suite-native/navigation';
import { selectEnabledTradingTypes, tradingActions } from '@suite-native/trading-state';

export const useActiveTradingTypeReaction = () => {
    const dispatch = useDispatch();
    const enabledTradingTypes = useSelector(selectEnabledTradingTypes);
    const { params } = useRoute<RouteProp<TradingStackParamList, TradingStackRoutes.Trading>>();
    const tradingType = params?.tradingType;

    useEffect(() => {
        let activeTradingType: TradingType = 'buy';

        if (tradingType && enabledTradingTypes.includes(tradingType)) {
            activeTradingType = tradingType;
        } else if (enabledTradingTypes.length > 0) {
            activeTradingType = enabledTradingTypes[0];
        }

        dispatch(tradingActions.setActiveTradingType(activeTradingType));

        return () => {
            dispatch(tradingActions.clearActiveTradingType());
        };
    }, [enabledTradingTypes, dispatch, tradingType]);
};
