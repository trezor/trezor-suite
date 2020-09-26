import React from 'react';
import styled from 'styled-components';
import { FormattedDate } from 'react-intl';
import { colors } from '@trezor/components';
import { Translation } from '@suite-components';
import { TooltipProps } from 'recharts';
import { getDateWithTimeZone } from '@suite/utils/suite/date';
import { Props as GraphProps } from '../../index';

const CustomTooltipWrapper = styled.div<{ coordinate: { x: number; y: number } }>`
    display: flex;
    flex-direction: column;
    color: ${colors.WHITE};
    background: #262742;
    background: rgba(38, 39, 66, 1);
    padding: 8px 6px;
    border-radius: 4px;
    box-shadow: 0 3px 14px 0 rgba(0, 0, 0, 0.15);
    font-variant-numeric: tabular-nums;
    transform: ${props => `translate(0px, ${props.coordinate.y - 100}px)`};

    line-height: 1.5;
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

interface Props extends TooltipProps {
    selectedRange: GraphProps['selectedRange'];
    receivedAmount: JSX.Element;
    sentAmount: JSX.Element;
    balance?: JSX.Element;
}

const formatDate = (date: Date, dateFormat: 'day' | 'month') => {
    if (dateFormat === 'day') {
        return <FormattedDate value={date} year="numeric" month="long" day="2-digit" />;
    }
    return <FormattedDate value={date} year="numeric" month="long" />;
};

const CustomTooltipBase = (props: Props) => {
    if (props.active && props.payload) {
        const date = getDateWithTimeZone(props.payload[0].payload.time * 1000);
        const dateFormat =
            props.selectedRange?.label === 'year' || props.selectedRange?.label === 'all'
                ? 'month'
                : 'day';

        // console.log('props.payload[0].payload.', props.payload[0].payload);
        return (
            <CustomTooltipWrapper coordinate={props.coordinate!}>
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
                                <Value>
                                    <Sign color="#55d92a">+</Sign>
                                    {props.receivedAmount}
                                </Value>
                            </Row>
                            <Row noBottomMargin>
                                <Value>
                                    <Sign color="#ff3838">-</Sign>
                                    {props.sentAmount}
                                </Value>
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
