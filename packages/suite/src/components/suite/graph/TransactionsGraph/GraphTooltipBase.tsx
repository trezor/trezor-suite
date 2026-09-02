import { type JSX, useEffect } from 'react';

import { type TooltipProps } from 'recharts';
import styled, { ThemeProvider } from 'styled-components';

import { Translation } from '@suite/intl';
import { Row, Text, intermediaryTheme } from '@trezor/components';

import { FormattedDate } from 'src/components/suite/FormattedDate';
import { type CommonAggregatedHistory, type GraphRange } from 'src/types/wallet/graph';

// Used for triggering custom Tooltip alignment
const OFFSET_LIMIT_HORIZONTAL = 125;

// The Tooltip is centered above the hovered point, but ancestors of the chart clip horizontal
// overflow (the app content is a scroll container), so the box is clamped to the chart's left
// edge and only the arrow keeps following the cursor
const getTooltipXPosition = (x: number, width: number): string =>
    x >= width - OFFSET_LIMIT_HORIZONTAL ? `calc(${x}px + 25%)` : `max(0px, calc(${x}px - 50%))`;

const getTooltipArrowXPosition = (x: number, width: number): string =>
    x >= width - OFFSET_LIMIT_HORIZONTAL ? `left: calc(75% + 1px);` : `left: min(${x}px, 50%);`;

interface WrapperProps {
    $positionX: number;
    $boxWidth: number;
}

const CustomTooltipWrapper = styled.div<WrapperProps>`
    display: flex;
    flex-direction: column;
    color: ${({ theme }) => theme.contentPrimary};
    background: ${({ theme }) => theme.surfaceFillModelessNeutralDark};
    outline: 1px solid ${({ theme }) => theme.surfaceBorderModelessNeutralDark};
    padding: 8px 6px;
    border-radius: 4px;
    box-shadow: ${({ theme }) => theme.surfaceShadowModeless};
    font-variant-numeric: tabular-nums;
    ${({ $positionX, $boxWidth }) =>
        $positionX >= $boxWidth - OFFSET_LIMIT_HORIZONTAL && `position: absolute; right: 0;`}
    transform: translate(${({ $positionX, $boxWidth }) =>
        getTooltipXPosition($positionX, $boxWidth)}, -90px);
    line-height: 1.5;

    &::after {
        position: absolute;
        content: '';
        top: 100%;
        ${({ $positionX, $boxWidth }) => getTooltipArrowXPosition($positionX, $boxWidth)}
        margin-left: -10px;
        width: 0;
        height: 0;
        /* stylelint-disable trezor/dimension-token-values -- These borders construct the tooltip arrow. */
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-top: 10px solid ${({ theme }) => theme.surfaceFillModelessNeutralDark};
        /* stylelint-enable trezor/dimension-token-values */
    }
`;

const Col = styled.div`
    display: flex;
    flex-direction: column;
`;

const Title = ({ children }: { children: React.ReactNode }) => (
    <Text typographyStyle="body-md" margin={{ right: 20 }}>
        {children}
    </Text>
);

const Value = ({ children }: { children: React.ReactNode }) => (
    <Text typographyStyle="body-md-strong">{children}</Text>
);

const ColsWrapper = styled.div`
    display: flex;
`;

const HighlightedArea = styled(Col)`
    padding: 8px 0;
    background: rgb(255 255 255 / 15%);
`;

const HighlightedAreaLeft = styled(HighlightedArea)`
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
`;

const HighlightedAreaRight = styled(HighlightedArea)`
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
`;

const formatDate = (date: Date, dateFormat: 'day' | 'month') => {
    if (dateFormat === 'day') {
        return <FormattedDate value={date} date month="long" />;
    }

    return <FormattedDate value={date} date day={undefined} />;
};

interface GraphTooltipBaseProps extends TooltipProps<number, any> {
    selectedRange: GraphRange;
    receivedAmount: JSX.Element;
    sentAmount: JSX.Element;
    balance?: JSX.Element;
    onShow?: (index: number) => void;
    extendedDataForInterval?: CommonAggregatedHistory[];
}

export const GraphTooltipBase = (props: GraphTooltipBaseProps) => {
    useEffect(() => {
        if (!props.onShow || !props.extendedDataForInterval) {
            return;
        }

        props.onShow(
            props.extendedDataForInterval.findIndex(
                item => item.time === props.payload?.[0]?.payload.time,
            ),
        );
    }, [props]);

    const firstEntry = props.payload?.[0];

    if (!props.active || !props.payload || !firstEntry) {
        return null;
    }

    const date = new Date(firstEntry.payload.time * 1000);
    const dateFormat =
        props.selectedRange?.label === 'year' || props.selectedRange?.label === 'all'
            ? 'month'
            : 'day';

    return (
        <ThemeProvider theme={{ variant: 'dark', ...intermediaryTheme.dark }}>
            <CustomTooltipWrapper
                $positionX={props.coordinate!.x!}
                $boxWidth={props.viewBox!.width!}
                data-testid="@dashboard/customtooltip"
            >
                <Row margin={{ bottom: 4, left: 8, right: 8 }}>
                    <Title>{date && formatDate(date, dateFormat)}</Title>
                </Row>

                <ColsWrapper>
                    <Col>
                        {props.balance && (
                            <Row
                                margin={{
                                    bottom: 4,
                                    left: 8,
                                    right: 8,
                                }}
                            >
                                <Title>
                                    <Translation id="TR_BALANCE" />
                                </Title>
                            </Row>
                        )}

                        <HighlightedAreaLeft>
                            <Row
                                margin={{
                                    bottom: 4,
                                    left: 8,
                                    right: 8,
                                }}
                            >
                                <Title>
                                    <Translation id="TR_RECEIVED" />
                                </Title>
                            </Row>

                            <Row margin={{ left: 8, right: 8 }}>
                                <Title>
                                    <Translation id="TR_SENT" />
                                </Title>
                            </Row>
                        </HighlightedAreaLeft>
                    </Col>

                    <Col>
                        {props.balance && (
                            <Row
                                margin={{
                                    bottom: 4,
                                    left: 8,
                                    right: 8,
                                }}
                            >
                                <Value>
                                    <Row margin={{ left: 8, right: 8 }}>{props.balance}</Row>
                                </Value>
                            </Row>
                        )}

                        <HighlightedAreaRight>
                            <Row
                                margin={{
                                    bottom: 4,
                                    left: 8,
                                    right: 8,
                                }}
                            >
                                <Value>{props.receivedAmount}</Value>
                            </Row>

                            <Row margin={{ left: 8, right: 8 }}>
                                <Value>{props.sentAmount}</Value>
                            </Row>
                        </HighlightedAreaRight>
                    </Col>
                </ColsWrapper>
            </CustomTooltipWrapper>
        </ThemeProvider>
    );
};
