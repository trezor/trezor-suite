import { useEffect, useEffectEvent, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    TRADING_SETTINGS_MAX_SLIPPAGE_PERCENTAGE_DEFAULT,
    selectTradingExchangeSelectedQuoteSwapSlippage,
    tradingExchangeActions,
} from '@suite-common/trading';

export const useSlippageLifecycle = (
    onSlippageChanged: (newSlippage: string | undefined) => void,
) => {
    const dispatch = useDispatch();
    const currentSlippage = useSelector(selectTradingExchangeSelectedQuoteSwapSlippage);
    const prefSlippageRef = useRef(TRADING_SETTINGS_MAX_SLIPPAGE_PERCENTAGE_DEFAULT);
    const slippageChangeEffect = useEffectEvent(onSlippageChanged);

    useEffect(() => {
        dispatch(
            tradingExchangeActions.setSelectedQuoteSwapSlippage(
                TRADING_SETTINGS_MAX_SLIPPAGE_PERCENTAGE_DEFAULT,
            ),
        );
    }, [dispatch]);

    useEffect(() => {
        if (!currentSlippage) {
            return;
        }

        if (currentSlippage === prefSlippageRef.current) {
            return;
        }

        prefSlippageRef.current = currentSlippage;
        slippageChangeEffect(currentSlippage);
    }, [currentSlippage]);
};
