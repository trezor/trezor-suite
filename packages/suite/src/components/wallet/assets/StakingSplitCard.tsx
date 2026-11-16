import { Translation } from '@suite/intl';
import { type StakingRateResult, isStakeInsideAccountBalance } from '@suite-common/earn-staking';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Box, Card, Column, Row, SegmentedBar, Text, TextButton } from '@trezor/components';
import { ArrowRightIcon } from '@trezor/icons';
import { type Color } from '@trezor/theme';

import { BaseCurrencyValue } from '#src/components/suite/BaseCurrencyValue';

import { StakingRateText } from './StakingRateText';
import { StakingSplitLegendSquare } from './StakingSplitLegendSquare';

const AVAILABLE_COLOR = 'elementFillAccentVioletBold' satisfies Color;
const UNSTAKED_COLOR = 'elementFillNeutralSoft' satisfies Color;
const STAKING_COLOR = 'elementFillBrandBold' satisfies Color;

type StakingSplitCardProps = {
    networkSymbol: NetworkSymbol;
    availableAmount: string;
    stakingAmount: string;
    /** The share of the coin that is staked, from 0 to 1. */
    stakingRatio: number;
    stakingRate: StakingRateResult;
    showAllocation?: boolean;
    onViewAll: () => void;
    'data-testid': string;
};

/** A coin split into what is staked and what is not, with the rate the stake earns. */
export const StakingSplitCard = ({
    networkSymbol,
    availableAmount,
    stakingAmount,
    stakingRatio,
    stakingRate,
    showAllocation = true,
    onViewAll,
    'data-testid': dataTestId,
}: StakingSplitCardProps) => {
    // A stake inside the balance leaves the whole balance spendable, so the rest is unstaked, not
    // the only part available.
    const isStakeInsideBalance = isStakeInsideAccountBalance(networkSymbol);
    const unstakedColor = isStakeInsideBalance ? UNSTAKED_COLOR : AVAILABLE_COLOR;

    // A product without a rate, a testnet, says so once its info is cached.
    const { rate, rateKind, isPending: isRatePending } = stakingRate;

    return (
        <Box flex="1" minWidth={280}>
            <Card paddingType="none" height="100%" data-testid={dataTestId}>
                <Box padding={20}>
                    <Column gap={16} alignItems="stretch">
                        <Row justifyContent="space-between" alignItems="center">
                            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                                <Translation id="TR_EARN" />
                            </Text>
                            <TextButton
                                size="small"
                                iconRight={ArrowRightIcon}
                                onClick={onViewAll}
                                data-testid={`${dataTestId}/view-all`}
                            >
                                <Translation id="TR_VIEW_ALL" />
                            </TextButton>
                        </Row>
                        {showAllocation && (
                            <SegmentedBar
                                data-testid={`${dataTestId}/allocation`}
                                segments={[
                                    { value: 1 - stakingRatio, color: unstakedColor },
                                    { value: stakingRatio, color: STAKING_COLOR },
                                ]}
                            />
                        )}
                        <Row justifyContent="space-between" alignItems="center">
                            <Row gap={12} alignItems="center">
                                <StakingSplitLegendSquare color={unstakedColor} />
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    <Translation
                                        id={
                                            isStakeInsideBalance
                                                ? 'TR_ASSET_DETAIL_UNSTAKED'
                                                : 'TR_STAKE_AVAILABLE'
                                        }
                                    />
                                </Text>
                            </Row>
                            <Text typographyStyle="body-md-strong">
                                <BaseCurrencyValue
                                    amount={availableAmount}
                                    symbol={networkSymbol}
                                />
                            </Text>
                        </Row>
                        <Row justifyContent="space-between" alignItems="center">
                            <Row gap={12} alignItems="center">
                                <StakingSplitLegendSquare color={STAKING_COLOR} />
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    <Translation id="TR_STAKE_STAKED" />
                                </Text>
                            </Row>
                            <Row gap={12} alignItems="center">
                                {!isRatePending && rateKind !== null && (
                                    <Text typographyStyle="body-sm" intent="brand">
                                        <StakingRateText rate={rate} rateKind={rateKind} />
                                    </Text>
                                )}
                                <Text typographyStyle="body-md-strong">
                                    <BaseCurrencyValue
                                        amount={stakingAmount}
                                        symbol={networkSymbol}
                                    />
                                </Text>
                            </Row>
                        </Row>
                    </Column>
                </Box>
            </Card>
        </Box>
    );
};
