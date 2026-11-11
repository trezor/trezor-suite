import { HiddenPlaceholder } from '@suite/discreet-mode';
import { Translation } from '@suite/intl';
import {
    selectEarnTotalFiatAmount,
    selectIsEarnFiatTotalIncomplete,
    selectIsEarnFiatTotalUnavailable,
    selectStakingTotalFiatAmount,
    selectYieldTotalFiatAmount,
    useEarnMissingRateTickersQuery,
    useYieldOpportunities,
} from '@suite-common/wallet-core';
import { Card, Column, SegmentedBar, Text } from '@trezor/components';
import { type Color } from '@trezor/theme';
import { BigNumber } from '@trezor/utils';

import { useSelector } from '#src/hooks/suite/useSelector';

import { EarnBalanceBreakdownRow } from './EarnBalanceBreakdownRow';

const STAKING_COLOR = 'contentBrand' satisfies Color;
const YIELD_COLOR = 'elementFillBrandBold' satisfies Color;

export const EarnBalanceBreakdown = () => {
    const { yieldOpportunities } = useYieldOpportunities();
    const { isFiatRatesLoading } = useEarnMissingRateTickersQuery();

    const totalStakingFiatAmount = useSelector(selectStakingTotalFiatAmount);

    const totalYieldFiatAmount = useSelector(state =>
        selectYieldTotalFiatAmount(state, yieldOpportunities),
    );

    const totalEarnFiatAmount = useSelector(state =>
        selectEarnTotalFiatAmount(state, yieldOpportunities),
    );

    const isFiatTotalUnavailable = useSelector(state =>
        selectIsEarnFiatTotalUnavailable(state, yieldOpportunities, isFiatRatesLoading),
    );

    const isFiatTotalIncomplete = useSelector(state =>
        selectIsEarnFiatTotalIncomplete(state, yieldOpportunities, isFiatRatesLoading),
    );

    const ratio = new BigNumber(totalEarnFiatAmount).isZero()
        ? 0.5
        : new BigNumber(totalStakingFiatAmount).dividedBy(totalEarnFiatAmount).toNumber();

    return (
        <Card>
            <Column gap={8}>
                <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                    <Translation id="TR_EARN_POSITIONS_BREAKDOWN" />
                </Text>

                {isFiatTotalUnavailable ? (
                    <HiddenPlaceholder enforceIntensity={10}>
                        <Text typographyStyle="headline-lg">
                            <Translation id="TR_EARN_N_A" />
                        </Text>
                    </HiddenPlaceholder>
                ) : (
                    <Column gap={16} width="100%" alignItems="stretch">
                        <SegmentedBar
                            segments={[
                                { value: ratio, color: STAKING_COLOR },
                                { value: 1 - ratio, color: YIELD_COLOR },
                            ]}
                        />

                        <Column gap={8}>
                            <EarnBalanceBreakdownRow
                                amount={totalStakingFiatAmount}
                                isApproximate={isFiatTotalIncomplete}
                                translationId="TR_EARN_STAKING"
                                color={STAKING_COLOR}
                            />

                            <EarnBalanceBreakdownRow
                                amount={totalYieldFiatAmount}
                                isApproximate={isFiatTotalIncomplete}
                                translationId="TR_EARN_DEFI_YIELD"
                                color={YIELD_COLOR}
                            />
                        </Column>
                    </Column>
                )}
            </Column>
        </Card>
    );
};
