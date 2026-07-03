import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import {
    TimeSwitch,
    type TimeframeHoursValue,
    selectPortfolioGraphTimeframe,
    setPortfolioGraphTimeframe,
    timeSwitchItems,
} from '@suite-native/graph';

export const PortfolioGraphTimeSwitch = () => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const timeframe = useSelector(selectPortfolioGraphTimeframe);

    const handleSelectPortfolioTimeframe = useCallback(
        (timeframeHours: TimeframeHoursValue) => {
            if (timeframe !== timeframeHours) {
                dispatch(setPortfolioGraphTimeframe({ timeframeHours }));

                const timeframeKey = timeSwitchItems.find(
                    item => item.valueBackInHours === timeframeHours,
                )?.key;
                if (timeframeKey) {
                    analytics.report({
                        type: events.watchPortfolioTimeframeChangeEvent.name,
                        payload: { timeframe: timeframeKey },
                    });
                }
            }
        },
        [dispatch, timeframe, analytics],
    );

    return (
        <TimeSwitch
            selectedTimeFrame={timeframe}
            onSelectTimeFrame={handleSelectPortfolioTimeframe}
        />
    );
};
