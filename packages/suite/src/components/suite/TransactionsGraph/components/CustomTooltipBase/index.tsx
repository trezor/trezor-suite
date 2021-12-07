import React, { useEffect } from 'react';
import styled from 'styled-components';
import { Translation, FormattedDate, HiddenPlaceholder } from '@suite-components';
import { TooltipProps } from 'recharts';
import { CommonAggregatedHistory } from '@wallet-types/graph';
import { Props as GraphProps } from '../../definitions';

// Used for triggering custom Tooltip alignment
const OFFSET_LIMIT_HORIZONTAL = 125;

// When the Tooltip gets triggered near to the horizontal boundaries, it might overflow outside of the screen
// These positioning functions are used to align it properly from each side
const calculateXPosition = (x: number, offset = 0) => `calc(${x}px - ${x / 2}px + ${offset}px)`;
const calculateXPositionRight = (x: number, offset = 0) => `calc(${x}px + 25% + ${offset}px)`;

// Tooltip should be centered and above the chart bars but should not overflow horizontally thanks to the positioning functions
const getTooltipXPosition = (x: number, width: number): string => {
    if (x <= OFFSET_LIMIT_HORIZONTAL) {
        return calculateXPosition(x, -30);
    }
    if (x >= width - OFFSET_LIMIT_HORIZONTAL) {
        return calculateXPositionRight(x);
    }
    return `calc(${x}px - 50%)`;
};

// Align the triangle arrow in a similar manner
const getTooltipArrowXPosition = (x: number, width: number): string => {
    if (x <= OFFSET_LIMIT_HORIZONTAL) {
        return `left: ${calculateXPosition(x, -30)};`;
    }
    return x >= width - OFFSET_LIMIT_HORIZONTAL ? `left: calc(75% + 1px);` : `left: 50%;`;
};

const CustomTooltipWrapper = styled.div<{
    positionX: number;
    boxWidth: number;
}>`
    display: flex;
    flex-direction: column;
    color: ${props => props.theme.TYPE_WHITE};
    background: ${props => props.theme.BG_TOOLTIP};
    padding: 8px 6px;
    border-radius: 4px;
    box-shadow: 0 3px 14px 0 ${props => props.theme.BOX_SHADOW_BLACK_15};
    font-variant-numeric: tabular-nums;
    ${props =>
        props.positionX >= props.boxWidth - OFFSET_LIMIT_HORIZONTAL &&
        `position: absolute; right: 0;`}
    transform: translate(${props => getTooltipXPosition(props.positionX, props.boxWidth)}, -90px);
    line-height: 1.5;

    &:after {
        position: absolute;
        content: '';
        top: 100%;
        ${props => getTooltipArrowXPosition(props.positionX, props.boxWidth)}
        margin-left: ${props => (props.positionX <= OFFSET_LIMIT_HORIZONTAL ? `50px` : `-10px`)};
        width: 0;
        height: 0;
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-top: 10px solid ${props => props.theme.BG_TOOLTIP};
    }
`;

const Col = styled.div`
    display: flex;
    flex-direction: column;
`;

const Row = styled.div<{ noBottomMargin?: boolean }>`
    display: flex;
    white-space: nowrap;
    align-items: center;
    justify-content: space-between;
    padding: 0px 8px;
    margin-bottom: ${props => (props.noBottomMargin ? '0px' : '4px')};
`;

const Title = styled.span`
    font-weight: 500;
    margin-right: 20px;
`;
const Value = styled.span`
    font-weight: 600;
`;

const ColsWrapper = styled.div`
    display: flex;
`;

const HighlightedArea = styled(Col)`
    padding: 8px 0px;
    background: rgba(255, 255, 255, 0.15);
`;

const HighlightedAreaLeft = styled(HighlightedArea)`
    border-top-left-radius: 5px;
    border-bottom-left-radius: 5px;
`;

const HighlightedAreaRight = styled(HighlightedArea)`
    border-top-right-radius: 5px;
    border-bottom-right-radius: 5px;
`;

const Sign = styled.span<{ color: string }>`
    color: ${props => props.color};
    width: 1ch;
    margin-right: 4px;
`;

interface Props extends TooltipProps<number, any> {
    selectedRange: GraphProps['selectedRange'];
    receivedAmount: JSX.Element;
    sentAmount: JSX.Element;
    balance?: JSX.Element;
    onShow?: (index: number) => void;
    extendedDataForInterval?: CommonAggregatedHistory[];
}

const formatDate = (date: Date, dateFormat: 'day' | 'month') => {
    if (dateFormat === 'day') {
        return <FormattedDate value={date} date month="long" />;
    }
    return <FormattedDate value={date} date day={undefined} />;
};

const CustomTooltipBase = (props: Props) => {
    useEffect(() => {
        if (props.onShow && props.extendedDataForInterval) {
            props.onShow(
                props.extendedDataForInterval.findIndex(
                    item => item.time === props.payload![0].payload.time,
                ),
            );
        }
    }, [props]);

    if (props.active && props.payload) {
        const date = new Date(props.payload[0].payload.time * 1000);
        const dateFormat =
            props.selectedRange?.label === 'year' || props.selectedRange?.label === 'all'
                ? 'month'
                : 'day';

        return (
            <CustomTooltipWrapper positionX={props.coordinate!.x!} boxWidth={props.viewBox!.width!}>
                <Row>
                    <Title>{date && formatDate(date, dateFormat)}</Title>
                </Row>

                <ColsWrapper>
                    <Col>
                        {props.balance && (
                            <Row>
                                <Title>
                                    <Translation id="TR_BALANCE" />
                                </Title>
                            </Row>
                        )}
                        <HighlightedAreaLeft>
                            <Row>
                                <Title>
                                    <Translation id="TR_RECEIVED" />
                                </Title>
                            </Row>
                            <Row noBottomMargin>
                                <Title>
                                    <Translation id="TR_SENT" />
                                </Title>
                            </Row>
                        </HighlightedAreaLeft>
                    </Col>
                    <Col>
                        {props.balance && (
                            <Row>
                                <Value>
                                    <Sign color="transparent">+</Sign>
                                    {props.balance}
                                </Value>
                            </Row>
                        )}
                        <HighlightedAreaRight>
                            <Row>
                                <HiddenPlaceholder>
                                    <Value>
                                        <Sign color="#55d92a">+</Sign>
                                        {props.receivedAmount}
                                    </Value>
                                </HiddenPlaceholder>
                            </Row>
                            <Row noBottomMargin>
                                <HiddenPlaceholder>
                                    <Value>
                                        <Sign color="#ff3838">-</Sign>
                                        {props.sentAmount}
                                    </Value>
                                </HiddenPlaceholder>
                            </Row>
                        </HighlightedAreaRight>
                    </Col>
                </ColsWrapper>
            </CustomTooltipWrapper>
        );
    }

    return null;
};

export default CustomTooltipBase;
