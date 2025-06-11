import { format } from 'date-fns';
import styled from 'styled-components';

import { useFormatters } from '@suite-common/formatters';
import { Column, Icon, Paragraph, Row, Text, hexToRgba } from '@trezor/components';
import { spacings } from '@trezor/theme';

const TooltipContainer = styled.div`
    display: flex;
    flex-direction: column;
    padding: 8px 12px;
    background-color: ${({ theme }) => hexToRgba(theme.backgroundNeutralBold, 0.08)};
    //border: 2px solid ${({ theme }) => hexToRgba(theme.borderElevation1, 0.6)};
    // box-shadow: ${({ theme }) => theme.boxShadowBase};
    border-radius: 8px;
    backdrop-filter: blur(10px);
`;

const dateFormatterWithYear = (date: string) => format(new Date(date), 'd MMMM yyyy');

export const GraphTooltip = props => {
    const { active, payload, label, localCurrency } = props;
    const { FiatAmountFormatter } = useFormatters();

    if (active && payload && payload.length) {
        const interval = props.payload.filter(({ name }) => name.startsWith('main-line'));
        const from = interval[0].payload;
        const to = interval.length > 1 ? interval[1].payload : null;

        return (
            <TooltipContainer>
                <Column>
                    {to ? (
                        <>
                            <Row gap={spacings.xs} alignItems="center">
                                <Text typographyStyle="highlight">
                                    <FiatAmountFormatter
                                        value={from.fiatValue.toFixed()}
                                        currency={localCurrency}
                                        minimumFractionDigits={0}
                                    />
                                </Text>{' '}
                                <Icon name="arrowRight" variant="tertiary" size="small" />{' '}
                                <Text typographyStyle="highlight">
                                    <FiatAmountFormatter
                                        value={to.fiatValue.toFixed()}
                                        currency={localCurrency}
                                        minimumFractionDigits={0}
                                    />
                                </Text>
                            </Row>
                            {from.value < to?.value && (
                                <Paragraph variant="primary" typographyStyle="hint">
                                    received{' '}
                                    <FiatAmountFormatter
                                        value={(to.fiatValue - from.fiatValue).toFixed()}
                                        currency={localCurrency}
                                        minimumFractionDigits={0}
                                    />
                                    {from.value} {to.value}
                                </Paragraph>
                            )}
                            {from.value > to?.value && (
                                <Paragraph variant="destructive" typographyStyle="hint">
                                    spent{' '}
                                    <FiatAmountFormatter
                                        value={(from.fiatValue - to.fiatValue).toFixed()}
                                        currency={localCurrency}
                                        minimumFractionDigits={0}
                                    />
                                    {from.value} {to.value}
                                </Paragraph>
                            )}
                        </>
                    ) : (
                        <Paragraph>
                            <FiatAmountFormatter
                                value={from.fiatValue.toFixed()}
                                currency={localCurrency}
                                minimumFractionDigits={0}
                            />
                            <div>{from.value}</div>
                        </Paragraph>
                    )}

                    <Paragraph
                        variant="tertiary"
                        typographyStyle="label"
                        margin={{ top: spacings.xs }}
                    >
                        {dateFormatterWithYear(from.date)}
                    </Paragraph>
                </Column>
            </TooltipContainer>
        );
    }

    return null;
};
