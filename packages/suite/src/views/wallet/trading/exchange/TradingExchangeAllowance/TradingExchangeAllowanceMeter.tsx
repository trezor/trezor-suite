import styled, { useTheme } from 'styled-components';

import { Translation } from '@suite/intl';
import { type ExchangeAllowanceCoverage } from '@suite-common/trading';
import { Card, Column, ProgressBar, Row, Text } from '@trezor/components';

import { TradingExchangeAllowanceAmount } from './TradingExchangeAllowanceAmount';
import { type TradingExchangeAllowanceToken } from './useTradingExchangeAllowanceFlow';

// The marker sits outside the bar, so the bar is clipped on its own and the marker on top of it.
const Track = styled.div`
    position: relative;
`;

const Bar = styled.div`
    overflow: hidden;
    border-radius: 4px;
`;

const Marker = styled.div<{ $ratio: number }>`
    position: absolute;
    top: -3px;
    bottom: -3px;
    left: calc(${({ $ratio }) => $ratio * 100}% - 1px);
    width: 2px;
    background: ${({ theme }) => theme.contentPrimary};
`;

type TradingExchangeAllowanceMeterProps = {
    coverage: ExchangeAllowanceCoverage;
    token: TradingExchangeAllowanceToken;
    /** Allowance in token units. */
    allowedAmount: string;
    /** Token units the swap spends. */
    neededAmount: string;
};

export const TradingExchangeAllowanceMeter = ({
    coverage,
    token,
    allowedAmount,
    neededAmount,
}: TradingExchangeAllowanceMeterProps) => {
    const theme = useTheme();
    const isTooLow = coverage.kind === 'too_low';
    const intent = isTooLow ? 'warning' : 'brand';

    return (
        <Card type="sunken" paddingType="small" data-testid="@trading/allowance/meter">
            <Column gap={8}>
                <Row justifyContent="space-between" alignItems="baseline" gap={8}>
                    <Row gap={6} alignItems="baseline">
                        <Text
                            typographyStyle="headline-sm"
                            data-testid="@trading/allowance/allowed"
                        >
                            <TradingExchangeAllowanceAmount
                                amount={allowedAmount}
                                token={token}
                                isSymbolShown={false}
                            />
                        </Text>
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <Translation
                                id="TR_EXCHANGE_ALLOWANCE_ALLOWED"
                                values={{ displaySymbol: token.symbol }}
                            />
                        </Text>
                    </Row>
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation
                            id="TR_EXCHANGE_ALLOWANCE_NEEDED"
                            values={{
                                amount: (
                                    <Text typographyStyle="body-sm-strong">
                                        <TradingExchangeAllowanceAmount
                                            amount={neededAmount}
                                            token={token}
                                        />
                                    </Text>
                                ),
                            }}
                        />
                    </Text>
                </Row>
                <Track>
                    <Bar>
                        <ProgressBar
                            value={coverage.coveredRatio}
                            max={1}
                            foregroundColor={
                                isTooLow ? theme.elementFillWarningBold : theme.elementFillBrandBold
                            }
                        />
                    </Bar>
                    <Marker $ratio={coverage.neededRatio} />
                </Track>
                <Text typographyStyle="body-xs" intent={intent}>
                    {isTooLow && coverage.missingAmount !== undefined && (
                        <Translation
                            id="TR_EXCHANGE_ALLOWANCE_MISSING"
                            values={{
                                amount: (
                                    <TradingExchangeAllowanceAmount
                                        amount={coverage.missingAmount}
                                        token={token}
                                    />
                                ),
                            }}
                        />
                    )}
                    {!isTooLow && coverage.remainingAmount !== undefined && (
                        <Translation
                            id="TR_EXCHANGE_ALLOWANCE_LEFT_AFTER_SWAP"
                            values={{
                                amount: (
                                    <TradingExchangeAllowanceAmount
                                        amount={coverage.remainingAmount}
                                        token={token}
                                    />
                                ),
                            }}
                        />
                    )}
                </Text>
            </Column>
        </Card>
    );
};
