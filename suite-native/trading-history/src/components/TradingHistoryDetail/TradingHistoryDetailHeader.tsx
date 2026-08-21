import { useSelector } from 'react-redux';

import {
    type TradingRootState,
    type TradingTransactionStatus,
    type TradingType,
    isFinalStatus,
    selectTradingProviderCompanyName,
    selectTradingTradeByOrderId,
} from '@suite-common/trading';
import { Translation, useTranslate } from '@suite-native/intl';
import { exhaustive } from '@trezor/type-utils';

type TradingHistoryDetailHeaderProps = {
    orderId: string;
};

type HeaderState =
    | 'buy-completed'
    | 'buy-failed'
    | 'buy-processing'
    | 'exchange-completed'
    | 'exchange-kyc'
    | 'exchange-processing'
    | 'exchange-returned'
    | 'sell-completed'
    | 'sell-failed'
    | 'sell-processing';

const getHeaderState = (tradeType: TradingType, status: TradingTransactionStatus): HeaderState => {
    switch (tradeType) {
        case 'buy':
        case 'sell': {
            if (status === 'SUCCESS') {
                return `${tradeType}-completed`;
            }

            if (isFinalStatus(tradeType, status)) {
                return `${tradeType}-failed`;
            }

            return `${tradeType}-processing`;
        }
        case 'exchange':
            if (status === 'SUCCESS') {
                return 'exchange-completed';
            }

            if (status === 'KYC') {
                return 'exchange-kyc';
            }

            if (status === 'ERROR') {
                return 'exchange-returned';
            }

            return 'exchange-processing';
        default:
            return exhaustive(tradeType);
    }
};

const useTradingHistoryDetailHeaderState = (orderId: string) => {
    const trade = useSelector((state: TradingRootState) =>
        selectTradingTradeByOrderId(state, orderId),
    );

    if (!trade) {
        return {
            exchange: undefined,
            headerState: null,
            tradeType: undefined,
        };
    }

    const {
        data: { exchange, status },
        tradeType,
    } = trade;

    return {
        exchange,
        headerState: getHeaderState(tradeType, status),
        tradeType,
    };
};

export const TradingHistoryDetailHeader = ({ orderId }: TradingHistoryDetailHeaderProps) => {
    const { headerState } = useTradingHistoryDetailHeaderState(orderId);

    if (!headerState) {
        return null;
    }

    switch (headerState) {
        case 'buy-processing':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.header.buy.processing.title" />
            );
        case 'buy-completed':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.header.buy.completed.title" />
            );
        case 'buy-failed':
            return <Translation id="moduleTrading.tradeHistory.detail.header.buy.failed.title" />;
        case 'sell-processing':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.header.sell.processing.title" />
            );
        case 'sell-completed':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.header.sell.completed.title" />
            );
        case 'sell-failed':
            return <Translation id="moduleTrading.tradeHistory.detail.header.sell.failed.title" />;
        case 'exchange-processing':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.header.exchange.processing.title" />
            );
        case 'exchange-completed':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.header.exchange.completed.title" />
            );
        case 'exchange-kyc':
            return <Translation id="moduleTrading.tradeHistory.detail.header.exchange.kyc.title" />;
        case 'exchange-returned':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.header.exchange.returned.title" />
            );
        default:
            return exhaustive(headerState);
    }
};

export const TradingHistoryDetailHeaderSubtitle = ({
    orderId,
}: TradingHistoryDetailHeaderProps) => {
    const { translate } = useTranslate();
    const { exchange, headerState, tradeType } = useTradingHistoryDetailHeaderState(orderId);
    const providerName = useSelector((state: TradingRootState) =>
        tradeType ? selectTradingProviderCompanyName(state, exchange, tradeType) : undefined,
    );

    if (!headerState) {
        return null;
    }

    const translationValues = {
        providerName:
            providerName ??
            translate('moduleTrading.tradeHistory.detail.header.unknownProviderName'),
    };

    switch (headerState) {
        case 'buy-processing':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.header.buy.processing.description" />
            );
        case 'buy-completed':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.header.buy.completed.description" />
            );
        case 'buy-failed':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.header.buy.failed.description" />
            );
        case 'sell-processing':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.header.sell.processing.description" />
            );
        case 'sell-completed':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.header.sell.completed.description" />
            );
        case 'sell-failed':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.header.sell.failed.description" />
            );
        case 'exchange-processing':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.header.exchange.processing.description" />
            );
        case 'exchange-completed':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.header.exchange.completed.description" />
            );
        case 'exchange-kyc':
            return (
                <Translation
                    id="moduleTrading.tradeHistory.detail.header.exchange.kyc.description"
                    values={translationValues}
                />
            );
        case 'exchange-returned':
            return (
                <Translation
                    id="moduleTrading.tradeHistory.detail.header.exchange.returned.description"
                    values={translationValues}
                />
            );
        default:
            return exhaustive(headerState);
    }
};
