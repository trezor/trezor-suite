import { Translation } from '@suite/intl';
import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { Box, Card, Column, Row, SegmentedBar, Text, TextButton } from '@trezor/components';
import { ArrowRightIcon } from '@trezor/icons';
import { type Color } from '@trezor/theme';

import { BaseCurrencyValue } from '#src/components/suite/BaseCurrencyValue';
import { useFormatApy } from '#src/hooks/earn/useFormatApy';

import { AssetDetailEarnLegendSquare } from './AssetDetailEarnLegendSquare';

const AVAILABLE_COLOR = 'elementFillAccentVioletBold' satisfies Color;
const UNSTAKED_COLOR = 'elementFillNeutralSoft' satisfies Color;
const STAKING_COLOR = 'elementFillBrandBold' satisfies Color;

type AssetDetailEarnCardProps = {
    symbol: NetworkSymbol;
    availableAmount: string;
    stakingAmount: string;
    /** The share of the coin that is staked, from 0 to 1. */
    stakingRatio: number;
    apy: number | null | undefined;
    onViewAll: () => void;
    'data-testid': string;
};

/** A coin split into what is staked and what is not, with the rate the stake earns. */
export const AssetDetailEarnCard = ({
    symbol,
    availableAmount,
    stakingAmount,
    stakingRatio,
    apy,
    onViewAll,
    'data-testid': dataTestId,
}: AssetDetailEarnCardProps) => {
    const formatApy = useFormatApy();

    // A Cardano delegation leaves the whole balance spendable, so the rest is unstaked, not the
    // only part available.
    const isCardano = getNetworkType(symbol) === 'cardano';
    const unstakedColor = isCardano ? UNSTAKED_COLOR : AVAILABLE_COLOR;

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
                        <SegmentedBar
                            segments={[
                                { value: 1 - stakingRatio, color: unstakedColor },
                                { value: stakingRatio, color: STAKING_COLOR },
                            ]}
                        />
                        <Row justifyContent="space-between" alignItems="center">
                            <Row gap={12} alignItems="center">
                                <AssetDetailEarnLegendSquare color={unstakedColor} />
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    <Translation
                                        id={
                                            isCardano
                                                ? 'TR_ASSET_DETAIL_UNSTAKED'
                                                : 'TR_STAKE_AVAILABLE'
                                        }
                                    />
                                </Text>
                            </Row>
                            <Text typographyStyle="body-md-strong">
                                <BaseCurrencyValue amount={availableAmount} symbol={symbol} />
                            </Text>
                        </Row>
                        <Row justifyContent="space-between" alignItems="center">
                            <Row gap={12} alignItems="center">
                                <AssetDetailEarnLegendSquare color={STAKING_COLOR} />
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    <Translation id="TR_STAKE_STAKED" />
                                </Text>
                            </Row>
                            <Row gap={12} alignItems="center">
                                {apy != null && apy > 0 && (
                                    <Text typographyStyle="body-sm" intent="brand">
                                        {/* Tron pays its rate as an APR, as its Earn modal says. */}
                                        {getNetworkType(symbol) === 'tron' ? (
                                            <Translation
                                                id="TR_EARN_APR_APPROX"
                                                values={{ aprPercent: formatApy(apy) }}
                                            />
                                        ) : (
                                            <Translation
                                                id="TR_EARN_YIELD_BADGE_RATE"
                                                values={{ apy: formatApy(apy) }}
                                            />
                                        )}
                                    </Text>
                                )}
                                <Text typographyStyle="body-md-strong">
                                    <BaseCurrencyValue amount={stakingAmount} symbol={symbol} />
                                </Text>
                            </Row>
                        </Row>
                    </Column>
                </Box>
            </Card>
        </Box>
    );
};
