import {
    type StakingFiatRootState,
    selectDeviceStakingFiatValuations,
    selectDeviceStakingPositionsCount,
} from '@suite-common/earn-staking';
import {
    type EarnFiatValuation,
    type EarnListRootState,
    type YieldOpportunity,
    createStableTickerIds,
    getEarnMissingRateTickerIds,
    hasAnyEarnFiatRate,
    selectYieldFiatValuations,
    selectYieldPositionsCount,
    sumEarnFiatValuations,
} from '@suite-common/wallet-core';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';

export type EarnRootState = StakingFiatRootState & EarnListRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<EarnRootState>();

const selectIsFiatRatesLoadingParam = (
    _state: EarnRootState,
    _yieldOpportunities: readonly YieldOpportunity[],
    isFiatRatesLoading: boolean,
) => isFiatRatesLoading;

export const selectEarnFiatValuations = createMemoizedSelector(
    [selectDeviceStakingFiatValuations, selectYieldFiatValuations],
    (stakingFiatValuations, yieldFiatValuations): readonly EarnFiatValuation[] =>
        returnStableArrayIfEmpty([...stakingFiatValuations, ...yieldFiatValuations]),
);

export const selectEarnTotalFiatAmount = createMemoizedSelector(
    [selectEarnFiatValuations],
    (valuations): string => sumEarnFiatValuations(valuations),
);

export const selectEarnMissingTickerIds = createMemoizedSelector(
    [selectEarnFiatValuations],
    valuations => createStableTickerIds(...getEarnMissingRateTickerIds(valuations)),
);

export const selectIsEarnFiatTotalIncomplete = createMemoizedSelector(
    [selectEarnMissingTickerIds, selectIsFiatRatesLoadingParam],
    (missingTickerIds, isFiatRatesLoading): boolean =>
        missingTickerIds.length > 0 && !isFiatRatesLoading,
);

export const selectIsEarnFiatTotalUnavailable = createMemoizedSelector(
    [selectIsEarnFiatTotalIncomplete, selectEarnFiatValuations],
    (isFiatTotalIncomplete, valuations): boolean =>
        isFiatTotalIncomplete && !hasAnyEarnFiatRate(valuations),
);

export const selectIsEarnBalanceBreakdownDisplayed = createMemoizedSelector(
    [
        selectDeviceStakingPositionsCount,
        selectYieldPositionsCount,
        selectIsEarnFiatTotalIncomplete,
        selectIsEarnFiatTotalUnavailable,
    ],
    (
        stakingPositionsCount,
        yieldPositionsCount,
        isFiatTotalIncomplete,
        isFiatTotalUnavailable,
    ): boolean =>
        stakingPositionsCount > 0 &&
        yieldPositionsCount > 0 &&
        !isFiatTotalIncomplete &&
        !isFiatTotalUnavailable,
);

export const selectEarnPositionsCount = createMemoizedSelector(
    [selectDeviceStakingPositionsCount, selectYieldPositionsCount],
    (stakingPositionsCount, yieldPositionsCount): number =>
        stakingPositionsCount + yieldPositionsCount,
);
