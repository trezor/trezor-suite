import React from 'react';
import styled from 'styled-components';
import { FormattedDate } from 'react-intl';
import { colors } from '@trezor/components';
import { FiatValue, FormattedNumber } from '@suite-components';
import { Account } from '@wallet-types';
import { TooltipProps } from 'recharts';
import { getDateWithTimeZone } from '@suite/utils/suite/date';
import { Props as GraphProps, FiatGraphProps, CryptoGraphProps } from '../../index';

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

interface CommonProps extends TooltipProps {
    selectedRange: GraphProps['selectedRange'];
}

interface OneAssetProps extends CommonProps {
    variant: 'one-asset';
    symbol: Account['symbol'];
    sentValueFn: CryptoGraphProps['sentValueFn'];
    receivedValueFn: CryptoGraphProps['receivedValueFn'];
}

interface AllAssetsProps extends CommonProps {
    variant: 'all-assets';
    localCurrency: string;
    sentValueFn: FiatGraphProps['sentValueFn'];
    receivedValueFn: FiatGraphProps['receivedValueFn'];
}
type Props = AllAssetsProps | OneAssetProps;

const CustomTooltip = ({ active, payload, coordinate, ...props }: Props) => {
    if (active && payload) {
        const date = getDateWithTimeZone(payload[0].payload.time * 1000);

        const receivedAmountString = props.receivedValueFn(payload[0].payload);
        const sentAmountString = props.sentValueFn(payload[0].payload);

        const receivedAmount =
            props.variant === 'one-asset' ? (
                <>
                    {receivedAmountString} {props.symbol.toUpperCase()}
                    <FiatValue
                        amount={receivedAmountString!}
                        symbol={props.symbol}
                        source={payload[0].payload.rates}
                        useCustomSource
                    >
                        {({ value }) => (value ? <> ({value})</> : null)}
                    </FiatValue>
                </>
            ) : (
                <FormattedNumber
                    currency={props.localCurrency}
                    value={receivedAmountString ?? '0'}
                />
            );

        const sentAmount =
            props.variant === 'one-asset' ? (
                <>
                    {sentAmountString} {props.symbol.toUpperCase()}
                    <FiatValue
                        amount={sentAmountString!}
                        symbol={props.symbol}
                        source={payload[0].payload.rates}
                        useCustomSource
                    >
                        {({ value }) => (value ? <> ({value})</> : null)}
                    </FiatValue>
                </>
            ) : (
                <FormattedNumber currency={props.localCurrency} value={sentAmountString ?? '0'} />
            );

        const showMMYYFormat =
            props.selectedRange?.label === 'year' || props.selectedRange?.label === 'all';
        return (
            <CustomTooltipWrapper coordinate={coordinate!}>
                <DateWrapper>
                    {date && showMMYYFormat && (
                        //
                        <FormattedDate value={date} year="numeric" month="long" />
                    )}
                    {date && !showMMYYFormat && (
                        <FormattedDate value={date} year="numeric" month="long" day="2-digit" />
                    )}
                </DateWrapper>
                <Row>
                    <Rect color={colors.GREEN} /> Received {receivedAmount}
                </Row>
                <Row>
                    <Rect color={colors.RED_ERROR} /> Sent {sentAmount}
                </Row>
            </CustomTooltipWrapper>
        );
    }

    return null;
};

export default CustomTooltip;
