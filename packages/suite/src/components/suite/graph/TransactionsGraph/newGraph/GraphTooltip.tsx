import { format } from 'date-fns';
import styled from 'styled-components';

import { useFormatters } from '@suite-common/formatters';
import { Column, Icon, Paragraph, Row, Text, hexToRgba } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { RawDataItem } from './types';

const TooltipContainer = styled.div`
    display: flex;
    flex-direction: column;
    padding: 8px 12px;
    background-color: ${({ theme }) => hexToRgba(theme.backgroundNeutralBold, 0.08)};
    border-radius: 8px;
    backdrop-filter: blur(10px);
`;

const dateFormatterWithYear = (date: string) => format(new Date(date), 'd MMMM yyyy');

type GraphTooltip = {
    active: boolean;
    payload: {
        name: string;
        payload: RawDataItem;
    }[];
    label: string;
    localCurrency: string;
};

export const GraphTooltip = (props: GraphTooltip) => {
    const { active, payload, localCurrency } = props;
    const { FiatAmountFormatter } = useFormatters();

    if (active && payload && payload.length) {
        const interval = props.payload.filter(({ name }) => name.startsWith('main-line'));
        if (interval.length === 0) return null;

        const fromItem = interval[0].payload;
        const toItem = interval.length > 1 ? interval[1].payload : null;

        const from = fromItem.fiatValue || 0;
        const to = toItem?.fiatValue || 0;

        return (
            <TooltipContainer>
                <Column>
                    {toItem ? (
                        <>
                            <Row gap={spacings.xs} alignItems="center">
                                <Text typographyStyle="highlight">
                                    <FiatAmountFormatter
                                        value={from.toFixed()}
                                        currency={localCurrency}
                                        minimumFractionDigits={0}
                                    />
                                </Text>{' '}
                                <Icon name="arrowRight" variant="tertiary" size="small" />{' '}
                                <Text typographyStyle="highlight">
                                    <FiatAmountFormatter
                                        value={to.toFixed()}
                                        currency={localCurrency}
                                        minimumFractionDigits={0}
                                    />
                                </Text>
                            </Row>
                            {fromItem.value < toItem?.value && (
                                <Paragraph variant="primary" typographyStyle="hint">
                                    received{' '}
                                    <FiatAmountFormatter
                                        value={(to - from).toFixed()}
                                        currency={localCurrency}
                                        minimumFractionDigits={0}
                                    />
                                    {from.toFixed()} {to.toFixed()}
                                </Paragraph>
                            )}
                            {fromItem.value > toItem?.value && (
                                <Paragraph variant="destructive" typographyStyle="hint">
                                    spent{' '}
                                    <FiatAmountFormatter
                                        value={(from - to).toFixed()}
                                        currency={localCurrency}
                                        minimumFractionDigits={0}
                                    />
                                    {fromItem.value} {toItem.value}
                                </Paragraph>
                            )}
                        </>
                    ) : (
                        <Paragraph>
                            <Paragraph variant="tertiary" typographyStyle="hint">
                                Portfolio value
                            </Paragraph>
                            <FiatAmountFormatter
                                value={from.toFixed()}
                                currency={localCurrency}
                                minimumFractionDigits={0}
                            />
                            <br />
                            <Paragraph
                                variant="tertiary"
                                typographyStyle="hint"
                                margin={{ top: 12 }}
                            >
                                Investment
                            </Paragraph>
                            <FiatAmountFormatter
                                value={(fromItem?.fiatValueInvestment || 0).toFixed()}
                                currency={localCurrency}
                                minimumFractionDigits={0}
                            />
                            {/*<div>{fromItem.value}</div>*/}
                            <br />
                            <br />
                            <div>
                                <Paragraph variant="tertiary" typographyStyle="hint">
                                    Diff
                                </Paragraph>
                                <FiatAmountFormatter
                                    value={(from - (fromItem?.fiatValueInvestment || 0)).toFixed()}
                                    currency={localCurrency}
                                    minimumFractionDigits={0}
                                />
                            </div>
                        </Paragraph>
                    )}

                    <Paragraph
                        variant="tertiary"
                        typographyStyle="label"
                        margin={{ top: spacings.xl }}
                    >
                        {dateFormatterWithYear(fromItem.date)}
                    </Paragraph>
                </Column>
            </TooltipContainer>
        );
    }

    return null;
};
