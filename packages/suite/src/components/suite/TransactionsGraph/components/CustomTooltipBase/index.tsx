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
    background: rgba(0, 0, 0, 0.8);
    padding: 12px 12px;
    border-radius: 3px;
    font-variant-numeric: tabular-nums;
    transform: ${props => `translate(0px, ${props.coordinate.y - 100}px)`};

    line-height: 1.5;
`;

const Row = styled.div`
    display: flex;
    white-space: nowrap;
    align-items: baseline;
`;

const DateWrapper = styled.div`
    display: flex;
    margin-bottom: 4px;
`;

const Rect = styled.div<{ color: string }>`
    width: 8px;
    height: 8px;
    background: ${props => props.color};
    margin-right: 4px;
`;

interface Props extends TooltipProps {
    selectedRange: GraphProps['selectedRange'];
    receivedAmount: JSX.Element;
    sentAmount: JSX.Element;
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

        return (
            <CustomTooltipWrapper coordinate={props.coordinate!}>
                <DateWrapper>{date && formatDate(date, dateFormat)}</DateWrapper>
                <Row>
                    <Rect color={colors.GREEN} />{' '}
                    <Translation
                        id="TR_RECEIVED_AMOUNT"
                        values={{ amount: props.receivedAmount }}
                    />
                </Row>
                <Row>
                    <Rect color={colors.RED_ERROR} />{' '}
                    <Translation id="TR_SENT_AMOUNT" values={{ amount: props.sentAmount }} />
                </Row>
            </CustomTooltipWrapper>
        );
    }

    return null;
};

export default CustomTooltipBase;
