import { type BuyTradeStatus, type ExchangeTradeStatus, type SellTradeStatus } from 'invity-api';

import { Translation } from '@suite/intl';
import { type TradingTransaction, exchangeUtils, sellUtils } from '@suite-common/trading';
import { Icon, Row, Text } from '@trezor/components';

import { getStatusMessage as getBuyStatusMessage } from 'src/utils/wallet/trading/buyUtils';

const getBuyTradeData = (status: BuyTradeStatus) => {
    const message = getBuyStatusMessage(status);

    switch (message) {
        case 'TR_BUY_STATUS_PENDING':
        case 'TR_BUY_STATUS_ACTION_REQUIRED':
            return {
                icon: 'clock',
                intent: 'warning',
                statusMessageId: message,
            } as const;
        case 'TR_BUY_STATUS_PENDING_GO_TO_GATEWAY':
            return {
                icon: 'clock',
                intent: 'warning',
                statusMessageId: message,
            } as const;
        case 'TR_BUY_STATUS_ERROR':
            return {
                icon: 'x',
                intent: 'critical',
                statusMessageId: message,
            } as const;
        case 'TR_BUY_STATUS_SUCCESS':
            return {
                icon: 'check',
                intent: 'brand',
                statusMessageId: message,
            } as const;
        // no default
    }
};

const getSellTradeData = (status: SellTradeStatus) => {
    const message = sellUtils.getStatusMessage(status);

    switch (message) {
        case 'TR_SELL_STATUS_PENDING':
            return {
                icon: 'clock',
                intent: 'warning',
                statusMessageId: message,
            } as const;
        case 'TR_SELL_STATUS_ERROR':
            return {
                icon: 'x',
                intent: 'critical',
                statusMessageId: message,
            } as const;
        case 'TR_SELL_STATUS_SUCCESS':
            return {
                icon: 'check',
                intent: 'brand',
                statusMessageId: message,
            } as const;
        // no default
    }
};

const getExchangeTradeData = (status: ExchangeTradeStatus) => {
    const message = exchangeUtils.getStatusMessage(status);

    switch (message) {
        case 'TR_EXCHANGE_STATUS_CONFIRMING':
        case 'TR_EXCHANGE_STATUS_CONVERTING':
            return {
                icon: 'clock',
                intent: 'warning',
                statusMessageId: message,
            } as const;
        case 'TR_EXCHANGE_STATUS_KYC':
            return {
                icon: 'warning',
                intent: 'warning',
                statusMessageId: message,
            } as const;
        case 'TR_EXCHANGE_STATUS_ERROR':
            return {
                icon: 'x',
                intent: 'critical',
                statusMessageId: message,
            } as const;
        case 'TR_EXCHANGE_STATUS_SUCCESS':
            return {
                icon: 'check',
                intent: 'brand',
                statusMessageId: message,
            } as const;
        // no default
    }
};

type StatusData =
    | ReturnType<typeof getBuyTradeData>
    | ReturnType<typeof getSellTradeData>
    | ReturnType<typeof getExchangeTradeData>;

const getData = (trade: TradingTransaction): StatusData | null => {
    if (!trade.data.status) return null;

    switch (trade.tradeType) {
        case 'buy':
            return getBuyTradeData(trade.data.status);
        case 'sell':
            return getSellTradeData(trade.data.status);
        default:
            return getExchangeTradeData(trade.data.status);
    }
};

interface TradingTransactionStatusProps {
    trade: TradingTransaction;
}

export const TradingTransactionStatus = ({ trade }: TradingTransactionStatusProps) => {
    const data = getData(trade);

    if (!data) return null;

    return (
        <Row>
            <Icon intent={data.intent} size={10} name={data.icon} margin={{ right: 4 }} />
            <Text intent={data.intent} data-testid="@trading/transactions/status">
                <Translation id={data.statusMessageId} />
            </Text>
        </Row>
    );
};
