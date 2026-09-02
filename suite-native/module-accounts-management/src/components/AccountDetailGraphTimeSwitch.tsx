import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import {
    type GraphSliceRootState,
    TimeSwitch,
    type TimeframeHoursValue,
    selectAccountGraphTimeframe,
    setAccountGraphTimeframe,
    timeSwitchItems,
} from '@suite-native/graph';

type AccountDetailGraphTimeSwitchProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const AccountDetailGraphTimeSwitch = ({
    accountKey,
    tokenContract,
}: AccountDetailGraphTimeSwitchProps) => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const timeframe = useSelector((state: GraphSliceRootState) =>
        selectAccountGraphTimeframe(state, accountKey, tokenContract),
    );
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const handleSelectTimeframe = useCallback(
        (timeframeHours: TimeframeHoursValue) => {
            if (timeframe === timeframeHours) return;

            dispatch(setAccountGraphTimeframe({ accountKey, tokenContract, timeframeHours }));

            const timeframeKey = timeSwitchItems.find(
                item => item.valueBackInHours === timeframeHours,
            )?.key;
            if (timeframeKey && symbol) {
                // TODO: Report tokenSymbol and tokenAddress if displaying ERC20 token account graph.
                // related to issue: https://github.com/trezor/trezor-suite/issues/7839
                analytics.report({
                    type: events.assetDetailTimeframeChangeEvent.name,
                    payload: { timeframe: timeframeKey, assetSymbol: symbol },
                });
            }
        },
        [dispatch, timeframe, accountKey, tokenContract, symbol, analytics],
    );

    return <TimeSwitch selectedTimeFrame={timeframe} onSelectTimeFrame={handleSelectTimeframe} />;
};
