import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    TimeSwitch,
    type TimeframeHoursValue,
    selectPortfolioGraphTimeframe,
    setPortfolioGraphTimeframe,
} from '@suite-native/graph';

export const PortfolioGraphTimeSwitch = () => {
    const dispatch = useDispatch();
    const timeframe = useSelector(selectPortfolioGraphTimeframe);

    const handleSelectPortfolioTimeframe = useCallback(
        (timeframeHours: TimeframeHoursValue) => {
            if (timeframe !== timeframeHours) {
                dispatch(setPortfolioGraphTimeframe({ timeframeHours }));
            }
        },
        [dispatch, timeframe],
    );

    return (
        <TimeSwitch
            selectedTimeFrame={timeframe}
            onSelectTimeFrame={handleSelectPortfolioTimeframe}
        />
    );
};
