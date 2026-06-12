import { useEffect, useEffectEvent, useRef } from 'react';
import { useSelector } from 'react-redux';

import { selectTradingMaxSlippagePercentage } from '@suite-common/trading';

// TODO this is temporary and will be removed/changed in #28651
export const useSlippageChange = (onSlippageChanged: (newSlippage: string) => void) => {
    const currentSlippage = useSelector(selectTradingMaxSlippagePercentage);
    const prefSlippageRef = useRef(currentSlippage);
    const slippageChangeEffect = useEffectEvent(onSlippageChanged);

    useEffect(() => {
        if (currentSlippage !== prefSlippageRef.current) {
            prefSlippageRef.current = currentSlippage;
            slippageChangeEffect(currentSlippage);
        }
    }, [currentSlippage]);
};
