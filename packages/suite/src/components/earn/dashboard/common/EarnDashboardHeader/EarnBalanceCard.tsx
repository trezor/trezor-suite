import { TotalBalanceCard, TotalBalanceHeadline } from '@suite/assets';
import { Translation } from '@suite/intl';
import {
    selectEarnPositionsCount,
    selectEarnTotalFiatAmount,
    selectIsEarnFiatTotalIncomplete,
    selectIsEarnFiatTotalUnavailable,
    useEarnMissingRateTickersQuery,
} from '@suite-common/earn';
import { useYieldOpportunities } from '@suite-common/wallet-core';
import { Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { useDiscovery } from '#src/hooks/suite/useDiscovery';
import { useSelector } from '#src/hooks/suite/useSelector';

export const EarnBalanceCard = () => {
    const { isDiscoveryRunning } = useDiscovery();
    const { yieldOpportunities } = useYieldOpportunities();
    const { isFiatRatesLoading } = useEarnMissingRateTickersQuery();

    const totalEarnFiatAmount = useSelector(state =>
        selectEarnTotalFiatAmount(state, yieldOpportunities),
    );

    const isFiatTotalIncomplete = useSelector(state =>
        selectIsEarnFiatTotalIncomplete(state, yieldOpportunities, isFiatRatesLoading),
    );

    const isFiatTotalUnavailable = useSelector(state =>
        selectIsEarnFiatTotalUnavailable(state, yieldOpportunities, isFiatRatesLoading),
    );

    const earnPositionsCount = useSelector(state =>
        selectEarnPositionsCount(state, yieldOpportunities),
    );

    const isLoading = isDiscoveryRunning || isFiatRatesLoading;
    const fiatValue = isFiatTotalUnavailable ? undefined : new BigNumber(totalEarnFiatAmount);

    return (
        <TotalBalanceCard
            label={<Translation id="TR_EARN_EARNING_BALANCE" />}
            isLoading={isLoading}
        >
            <TotalBalanceHeadline
                fiatValue={fiatValue}
                isApproximate={isFiatTotalIncomplete}
                fallback={<Translation id="TR_EARN_N_A" />}
                data-testid="@earn/dashboard/total-balance"
            />
            <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                <Translation
                    id={
                        earnPositionsCount === 0
                            ? 'TR_EARN_NO_POSITIONS'
                            : 'TR_EARN_ACTIVE_POSITIONS'
                    }
                    values={{ count: earnPositionsCount }}
                />
            </Text>
        </TotalBalanceCard>
    );
};
