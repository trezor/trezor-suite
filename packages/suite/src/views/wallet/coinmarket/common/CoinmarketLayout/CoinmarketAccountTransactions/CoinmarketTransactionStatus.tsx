import styled, { useTheme } from 'styled-components';
import { Translation } from 'src/components/suite';
import { getStatusMessage as getBuyStatusMessage } from 'src/utils/wallet/coinmarket/buyUtils';
import { getStatusMessage as getExchangeStatusMessage } from 'src/utils/wallet/coinmarket/exchangeUtils';
import { getStatusMessage as getSellStatusMessage } from 'src/utils/wallet/coinmarket/sellUtils';
import { variables, Icon, SuiteThemeColors } from '@trezor/components';
import { Trade } from 'src/types/wallet/coinmarketCommonTypes';
import { BuyTradeStatus, ExchangeTradeStatus, SellTradeStatus } from 'invity-api';

const Wrapper = styled.div<{ $color: string }>`
    display: flex;
    color: ${props => props.$color};
    align-items: center;
    font-size: ${variables.FONT_SIZE.TINY};
`;

const Text = styled.div`
    padding-top: 1px;
`;

const getBuyTradeData = (status: BuyTradeStatus, theme: SuiteThemeColors) => {
    const message = getBuyStatusMessage(status);
    switch (message) {
        case 'TR_BUY_STATUS_PENDING':
        case 'TR_BUY_STATUS_ACTION_REQUIRED':
            return {
                icon: 'clock',
                color: theme.legacy.TYPE_ORANGE,
                statusMessageId: message,
            } as const;
        case 'TR_BUY_STATUS_PENDING_GO_TO_GATEWAY':
            return {
                icon: 'clock',
                color: theme.legacy.TYPE_ORANGE,
                statusMessageId: message,
            } as const;
        case 'TR_BUY_STATUS_ERROR':
            return {
                icon: 'close',
                color: theme.legacy.TYPE_RED,
                statusMessageId: message,
            } as const;
        case 'TR_BUY_STATUS_SUCCESS':
            return {
                icon: 'check',
                color: theme.legacy.TYPE_GREEN,
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
                icon: 'clock',
                color: theme.legacy.TYPE_ORANGE,
                statusMessageId: message,
            } as const;
        case 'TR_SELL_STATUS_ERROR':
            return {
                icon: 'close',
                color: theme.legacy.TYPE_RED,
                statusMessageId: message,
            } as const;
        case 'TR_SELL_STATUS_SUCCESS':
            return {
                icon: 'check',
                color: theme.legacy.TYPE_GREEN,
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
                icon: 'clock',
                color: theme.legacy.TYPE_ORANGE,
                statusMessageId: message,
            } as const;
        case 'TR_EXCHANGE_STATUS_KYC':
            return {
                icon: 'warningTriangle',
                color: theme.legacy.TYPE_ORANGE,
                statusMessageId: message,
            } as const;
        case 'TR_EXCHANGE_STATUS_ERROR':
            return {
                icon: 'close',
                color: theme.legacy.TYPE_RED,
                statusMessageId: message,
            } as const;
        case 'TR_EXCHANGE_STATUS_SUCCESS':
            return {
                icon: 'check',
                color: theme.legacy.TYPE_GREEN,
                statusMessageId: message,
            } as const;
        // no default
    }
};

type StatusData =
    | ReturnType<typeof getBuyTradeData>
    | ReturnType<typeof getSellTradeData>
    | ReturnType<typeof getExchangeTradeData>;

interface StatusProps {
    trade: Trade['data'];
    tradeType: Trade['tradeType'];
    className?: string;
}

export const CoinmarketTransactionStatus = ({ trade, className, tradeType }: StatusProps) => {
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
        // no default
    }

    return (
        <Wrapper $color={data.color} className={className}>
            <Icon color={data.color} size={10} name={data.icon} margin={{ right: 4 }} />
            <Text data-testid="@coinmarket/transaction/status">
                <Translation id={data.statusMessageId} />
            </Text>
        </Wrapper>
    );
};
