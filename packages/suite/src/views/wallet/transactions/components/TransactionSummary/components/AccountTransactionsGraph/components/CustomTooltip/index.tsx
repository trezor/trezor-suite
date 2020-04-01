import React from 'react';
import styled from 'styled-components';
import { FormattedDate } from 'react-intl';
import { colors } from '@trezor/components';
import { FiatValue } from '@suite-components';
import { Account } from '@wallet-types';
import { TooltipProps } from 'recharts';
import { getDateWithTimeZone } from '@suite/utils/suite/date';

const CustomTooltipWrapper = styled.div<{ coordinate: { x: number; y: number } }>`
    display: flex;
    flex-direction: column;
    color: ${colors.WHITE};
    background: rgba(0, 0, 0, 0.8);
    padding: 12px 12px;
    border-radius: 3px;
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

interface Range {
    label: string;
    weeks: number;
}

interface CustomTooltipProps extends TooltipProps {
    symbol: Account['symbol'];
    selectedRange: Range;
}

const CustomTooltip = ({
    active,
    payload,
    coordinate,
    symbol,
    selectedRange,
}: CustomTooltipProps) => {
    if (active && payload) {
        const date = getDateWithTimeZone(payload[0].payload.time * 1000);
        return (
            <CustomTooltipWrapper coordinate={coordinate!}>
                <DateWrapper>
                    {date && selectedRange?.label === 'year' && (
                        //
                        <FormattedDate value={date} year="numeric" month="2-digit" />
                    )}
                    {date && selectedRange?.label !== 'year' && (
                        <FormattedDate value={date} year="numeric" month="2-digit" day="2-digit" />
                    )}
                </DateWrapper>
                <Row>
                    <Rect color={colors.GREEN} /> Received {payload[0].payload.received}{' '}
                    {symbol.toUpperCase()}
                    <FiatValue
                        amount={payload[0].payload.received}
                        symbol={symbol}
                        source={payload[0].payload.rates}
                        useCustomSource
                    >
                        {({ value }) => (value ? <> ({value})</> : null)}
                    </FiatValue>
                </Row>
                <Row>
                    <Rect color={colors.RED_ERROR} /> Sent {payload[0].payload.sent}{' '}
                    {symbol.toUpperCase()}
                    <FiatValue
                        amount={payload[0].payload.sent}
                        symbol={symbol}
                        source={payload[0].payload.rates}
                        useCustomSource
                    >
                        {({ value }) => (value ? <> ({value})</> : null)}
                    </FiatValue>
                </Row>
            </CustomTooltipWrapper>
        );
    }

    return null;
};

export default CustomTooltip;
