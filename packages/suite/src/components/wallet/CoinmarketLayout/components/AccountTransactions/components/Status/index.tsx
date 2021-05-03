import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { getStatusMessage as getBuyStatusMessage } from '@wallet-utils/coinmarket/buyUtils';
import { getStatusMessage as getExchangeStatusMessage } from '@wallet-utils/coinmarket/exchangeUtils';
import { getStatusMessage as getSellStatusMessage } from '@wallet-utils/coinmarket/sellUtils';
import { variables, Icon, useTheme, SuiteThemeColors } from '@trezor/components';
import { Trade } from '@wallet-types/coinmarketCommonTypes';
import { BuyTradeStatus, ExchangeTradeStatus, SellTradeStatus } from 'invity-api';

interface Props {
    trade: Trade['data'];
    tradeType: Trade['tradeType'];
    className?: string;
}

const Wrapper = styled.div<{ color: string }>`
    display: flex;
    color: ${props => props.color};
    align-items: center;
    font-size: ${variables.FONT_SIZE.TINY};
`;

const Text = styled.div`
    padding-top: 1px;
`;

const StyledIcon = styled(Icon)`
    margin-right: 3px;
`;

const getBuyTradeData = (status: BuyTradeStatus, theme: SuiteThemeColors) => {
    const message = getBuyStatusMessage(status);
    switch (message) {
        case 'TR_BUY_STATUS_PENDING':
        case 'TR_BUY_STATUS_ACTION_REQUIRED':
            return {
                icon: 'CLOCK',
                color: theme.TYPE_ORANGE,
                statusMessageId: message,
            } as const;
        case 'TR_BUY_STATUS_PENDING_GO_TO_GATEWAY':
            return {
                icon: 'CLOCK',
                color: theme.TYPE_ORANGE,
                statusMessageId: message,
            } as const;
        case 'TR_BUY_STATUS_ERROR':
            return {
                icon: 'CROSS',
                color: theme.TYPE_RED,
                statusMessageId: message,
            } as const;
        case 'TR_BUY_STATUS_SUCCESS':
            return {
                icon: 'CHECK',
                color: theme.TYPE_GREEN,
                statusMessageId: message,
            } as const;
        // no default
    }
};

const getSellTradeData = (status: SellTradeStatus, theme: SuiteThemeColors) => {
    const message = getSellStatusMessage(status);
    switch (message) {
        case 'TR_SELL_STATUS_PENDING':
            return {
                icon: 'CLOCK',
                color: theme.TYPE_ORANGE,
                statusMessageId: message,
            } as const;
        case 'TR_SELL_STATUS_ERROR':
            return {
                icon: 'CROSS',
                color: theme.TYPE_RED,
                statusMessageId: message,
            } as const;
        case 'TR_SELL_STATUS_SUCCESS':
            return {
                icon: 'CHECK',
                color: theme.TYPE_GREEN,
                statusMessageId: message,
            } as const;
        // no default
    }
};

const getExchangeTradeData = (status: ExchangeTradeStatus, theme: SuiteThemeColors) => {
    const message = getExchangeStatusMessage(status);
    switch (message) {
        case 'TR_EXCHANGE_STATUS_CONFIRMING':
        case 'TR_EXCHANGE_STATUS_CONVERTING':
            return {
                icon: 'CLOCK',
                color: theme.TYPE_ORANGE,
                statusMessageId: message,
            } as const;
        case 'TR_EXCHANGE_STATUS_KYC':
            return {
                icon: 'WARNING',
                color: theme.TYPE_ORANGE,
                statusMessageId: message,
            } as const;
        case 'TR_EXCHANGE_STATUS_ERROR':
            return {
                icon: 'CROSS',
                color: theme.TYPE_RED,
                statusMessageId: message,
            } as const;
        case 'TR_EXCHANGE_STATUS_SUCCESS':
            return {
                icon: 'CHECK',
                color: theme.TYPE_GREEN,
                statusMessageId: message,
            } as const;
        // no default
    }
};

const getSpendTradeData = (theme: SuiteThemeColors) =>
    ({
        icon: 'CHECK',
        color: theme.TYPE_GREEN,
        statusMessageId: 'TR_SPEND_STATUS_FINISHED',
    } as const);

type StatusData =
    | ReturnType<typeof getBuyTradeData>
    | ReturnType<typeof getSellTradeData>
    | ReturnType<typeof getExchangeTradeData>
    | ReturnType<typeof getSpendTradeData>;

const Status = ({ trade, className, tradeType }: Props) => {
    const theme = useTheme();
    let data: StatusData;
    switch (tradeType) {
        case 'buy':
            data = getBuyTradeData(trade.status as BuyTradeStatus, theme);
            break;
        case 'sell':
            data = getSellTradeData(trade.status as SellTradeStatus, theme);
            break;
        case 'exchange':
            data = getExchangeTradeData(trade.status as ExchangeTradeStatus, theme);
            break;
        case 'spend':
            data = getSpendTradeData(theme);
            break;
        // no default
    }

    return (
        <Wrapper color={data.color} className={className}>
            <StyledIcon color={data.color} size={10} icon={data.icon} />
            <Text>
                <Translation id={data.statusMessageId} />
            </Text>
        </Wrapper>
    );
};

export default Status;
