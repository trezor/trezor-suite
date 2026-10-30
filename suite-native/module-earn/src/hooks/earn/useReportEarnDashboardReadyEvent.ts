import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { useIsFocused } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { type EarnListRootState, selectYieldPromoListItems } from '@suite-common/wallet-core';
import { injectNativeAnalytics } from '@suite-native/analytics';
import { useEarnEntryId } from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';

import { selectStakingPromoListSymbols } from '../../earnScreenSelectors';

type UseReportEarnDashboardReadyEventProps = {
    yieldOpportunities: YieldDtoV2[];
    isLoading: boolean;
    isError: boolean;
    yieldPositionsCount: number;
    stakingPositionsCount: number;
    claimItemsCount: number;
    isStakingDisabled: boolean;
    isYieldDisabled: boolean;
};

export const useReportEarnDashboardReadyEvent = ({
    yieldOpportunities,
    isLoading,
    isError,
    yieldPositionsCount,
    stakingPositionsCount,
    claimItemsCount,
    isStakingDisabled,
    isYieldDisabled,
}: UseReportEarnDashboardReadyEventProps) => {
    const { analytics } = useServices(injectNativeAnalytics);
    const isFocused = useIsFocused();
    const entryId = useEarnEntryId();

    const vaults = useSelector((state: EarnListRootState) =>
        selectYieldPromoListItems(state, yieldOpportunities),
    );
    const stakingSymbols = useSelector(selectStakingPromoListSymbols);
    const availableVaultCount = isYieldDisabled ? 0 : vaults.length;
    const availableStakingCount = isStakingDisabled ? 0 : stakingSymbols.length;
    const hasYieldPosition = !isYieldDisabled && yieldPositionsCount > 0;
    const hasStakingPosition = !isStakingDisabled && stakingPositionsCount > 0;
    const hasClaimBanner = !isYieldDisabled && claimItemsCount > 0;

    const reportedEntryIdRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (
            !isFocused ||
            !entryId ||
            reportedEntryIdRef.current === entryId ||
            isLoading ||
            isError
        )
            return;

        reportedEntryIdRef.current = entryId;

        analytics.report({
            type: events.earnDashboardReadyEvent.name,
            payload: {
                hasClaimBanner,
                hasYieldPosition,
                hasStakingPosition,
                availableVaultCount,
                availableStakingCount,
                hasShowMore: false,
            },
        });
    }, [
        analytics,
        availableVaultCount,
        availableStakingCount,
        isLoading,
        isError,
        hasYieldPosition,
        hasStakingPosition,
        hasClaimBanner,
        isFocused,
        entryId,
    ]);
};
