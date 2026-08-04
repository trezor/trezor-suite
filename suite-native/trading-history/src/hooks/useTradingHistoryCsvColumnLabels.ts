import { useMemo } from 'react';

import {
    TRADING_HISTORY_CSV_COLUMNS,
    type TradingHistoryCsvColumn,
    type TradingHistoryCsvColumnLabels,
} from '@suite-common/trading';
import { type Translate, useTranslate } from '@suite-native/intl';
import { exhaustive } from '@trezor/type-utils';

const getColumnLabel = (translate: Translate, column: TradingHistoryCsvColumn): string => {
    switch (column) {
        case 'orderId':
            return translate('moduleTrading.tradeHistory.export.columns.orderId');
        case 'date':
            return translate('moduleTrading.tradeHistory.export.columns.date');
        case 'type':
            return translate('moduleTrading.tradeHistory.export.columns.type');
        case 'spentAmount':
            return translate('moduleTrading.tradeHistory.export.columns.spentAmount');
        case 'spendTicker':
            return translate('moduleTrading.tradeHistory.export.columns.spendTicker');
        case 'spendNetwork':
            return translate('moduleTrading.tradeHistory.export.columns.spendNetwork');
        case 'spendTransactionId':
            return translate('moduleTrading.tradeHistory.export.columns.spendTransactionId');
        case 'receiveAmount':
            return translate('moduleTrading.tradeHistory.export.columns.receiveAmount');
        case 'receiveTicker':
            return translate('moduleTrading.tradeHistory.export.columns.receiveTicker');
        case 'receiveNetwork':
            return translate('moduleTrading.tradeHistory.export.columns.receiveNetwork');
        case 'provider':
            return translate('moduleTrading.tradeHistory.export.columns.provider');
        case 'status':
            return translate('moduleTrading.tradeHistory.export.columns.status');
        case 'receiveTransactionId':
            return translate('moduleTrading.tradeHistory.export.columns.receiveTransactionId');
        case 'paymentId':
            return translate('moduleTrading.tradeHistory.export.columns.paymentId');
        default:
            return exhaustive(column);
    }
};

export const useTradingHistoryCsvColumnLabels = (): TradingHistoryCsvColumnLabels => {
    const { translate } = useTranslate();

    return useMemo(
        () =>
            Object.fromEntries(
                TRADING_HISTORY_CSV_COLUMNS.map((column): [TradingHistoryCsvColumn, string] => [
                    column,
                    getColumnLabel(translate, column),
                ]),
            ) as TradingHistoryCsvColumnLabels,
        [translate],
    );
};
