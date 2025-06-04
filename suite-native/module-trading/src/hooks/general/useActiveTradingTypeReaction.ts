import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { RouteProp, useRoute } from '@react-navigation/native';

import { TradingType } from '@suite-common/trading';
import { TradingStackParamList, TradingStackRoutes } from '@suite-native/navigation';

import { selectEnabledTradingTypes } from '../../selectors/commonSelectors';
import { tradingActions } from '../../tradingSlice';

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
