import { DefaultTheme, useTheme } from 'styled-components';
import { Translation } from 'src/components/suite';
import { getStatusMessage as getBuyStatusMessage } from 'src/utils/wallet/coinmarket/buyUtils';
import { getStatusMessage as getExchangeStatusMessage } from 'src/utils/wallet/coinmarket/exchangeUtils';
import { getStatusMessage as getSellStatusMessage } from 'src/utils/wallet/coinmarket/sellUtils';
import { Icon, Row, Text } from '@trezor/components';
import { Trade } from 'src/types/wallet/coinmarketCommonTypes';
import { BuyTradeStatus, ExchangeTradeStatus, SellTradeStatus } from 'invity-api';
import { spacings } from '@trezor/theme';

const getBuyTradeData = (status: BuyTradeStatus, theme: DefaultTheme) => {
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

const getSellTradeData = (status: SellTradeStatus, theme: DefaultTheme) => {
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

const getExchangeTradeData = (status: ExchangeTradeStatus, theme: DefaultTheme) => {
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

const getData = (trade: Trade, theme: DefaultTheme): StatusData | null => {
    if (!trade.data.status) return null;

    switch (trade.tradeType) {
        case 'buy':
            return getBuyTradeData(trade.data.status, theme);
        case 'sell':
            return getSellTradeData(trade.data.status, theme);
        default:
            return getExchangeTradeData(trade.data.status, theme);
    }
};

interface CoinmarketTransactionStatusProps {
    trade: Trade;
}

export const CoinmarketTransactionStatus = ({ trade }: CoinmarketTransactionStatusProps) => {
    const theme = useTheme();
    const data = getData(trade, theme);

    if (!data) return null;

    return (
        <Row margin={{ left: spacings.xxs }}>
            <Icon color={data.color} size={10} name={data.icon} margin={{ right: 4 }} />
            <Text color={data.color} data-testid="@coinmarket/transaction/status">
                <Translation id={data.statusMessageId} />
            </Text>
        </Row>
    );
};
