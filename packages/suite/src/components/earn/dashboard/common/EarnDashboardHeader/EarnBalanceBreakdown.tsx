import { useTheme } from 'styled-components';

import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import {
    selectBaseCurrency,
    selectEarnTotalFiatAmount,
    selectIsEarnFiatTotalIncomplete,
    selectIsEarnFiatTotalUnavailable,
    selectStakingTotalFiatAmount,
    selectYieldTotalFiatAmount,
    useEarnMissingRateTickersQuery,
    useYieldOpportunities,
} from '@suite-common/wallet-core';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Box, Card, Column, ProgressBar, Row, Text } from '@trezor/components';
import { type Color } from '@trezor/theme';
import { BigNumber } from '@trezor/utils';

import { HiddenPlaceholder } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

const STAKING_COLOR = 'contentBrand' satisfies Color;
const YIELD_COLOR = 'elementFillBrandBold' satisfies Color;

const LegendSquare = ({ color }: { color: Color }) => (
    <Box width={12} height={12} borderRadius={4} backgroundColor={color} />
);

export const EarnBalanceBreakdown = () => {
    const theme = useTheme();
    const baseCurrency = useSelector(selectBaseCurrency);
    const { BaseCurrencyAmountFormatter } = useFormatters();

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

    const ratio = new BigNumber(totalStakingFiatAmount).dividedBy(totalEarnFiatAmount).toNumber();

    return (
        <Card>
            <Column gap={8}>
                <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                    <Translation id="TR_EARN_BALANCE_BREAKDOWN" />
                </Text>

                {isFiatTotalUnavailable ? (
                    <HiddenPlaceholder enforceIntensity={10}>
                        <Text typographyStyle="headline-lg">
                            <Translation id="TR_EARN_N_A" />
                        </Text>
                    </HiddenPlaceholder>
                ) : (
                    <Column gap={16} width="100%" alignItems="stretch">
                        <ProgressBar
                            value={ratio}
                            max={1}
                            backgroundColor={theme[YIELD_COLOR]}
                            foregroundColor={theme[STAKING_COLOR]}
                        />

                        <Row gap={12} width="100%" alignItems="center">
                            <LegendSquare color={STAKING_COLOR} />

                            <Row
                                gap={6}
                                flex="1"
                                alignItems="center"
                                justifyContent="space-between"
                            >
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    <Translation id="TR_EARN_STAKING" />
                                </Text>

                                <Text typographyStyle="body-md-strong">
                                    {isFiatTotalIncomplete && '≈ '}

                                    <BaseCurrencyAmountFormatter
                                        value={asBaseCurrencyAmount(
                                            new BigNumber(totalStakingFiatAmount),
                                        )}
                                        currency={baseCurrency}
                                    />
                                </Text>
                            </Row>
                        </Row>

                        <Row gap={12} width="100%" alignItems="center">
                            <LegendSquare color={YIELD_COLOR} />

                            <Row
                                gap={6}
                                flex="1"
                                alignItems="center"
                                justifyContent="space-between"
                            >
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    <Translation id="TR_EARN_DEFI_YIELD" />
                                </Text>

                                <Text typographyStyle="body-md-strong">
                                    {isFiatTotalIncomplete && '≈ '}

                                    <BaseCurrencyAmountFormatter
                                        value={asBaseCurrencyAmount(
                                            new BigNumber(totalYieldFiatAmount),
                                        )}
                                        currency={baseCurrency}
                                    />
                                </Text>
                            </Row>
                        </Row>
                    </Column>
                )}
            </Column>
        </Card>
    );
};
