import { useStore } from 'react-redux';

import { type TranslationFunction, useTranslation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import { triggerWebDownloadFile } from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type TradingHistoryCsvColumnLabels,
    type TradingRootStateWithDeviceAndAccounts,
    prepareTradingHistoryCsv,
    selectDeviceTradingTradesOrderedByDate,
} from '@suite-common/trading';

import { getExportedFileName } from 'src/utils/wallet/exportTransactionsUtils';

const CSV_MIME_TYPE = 'text/csv;charset=utf-8';
const CSV_FILE_NAME = 'trade_history';

const getCsvColumnLabels = (
    translationString: TranslationFunction,
): TradingHistoryCsvColumnLabels => ({
    orderId: translationString('TR_TRADING_TRADE_HISTORY_EXPORT_COLUMN_ORDER_ID'),
    date: translationString('TR_TRADING_TRADE_HISTORY_EXPORT_COLUMN_DATE'),
    type: translationString('TR_TRADING_TRADE_HISTORY_EXPORT_COLUMN_TYPE'),
    spentAmount: translationString('TR_TRADING_TRADE_HISTORY_EXPORT_COLUMN_SPENT_AMOUNT'),
    spendTicker: translationString('TR_TRADING_TRADE_HISTORY_EXPORT_COLUMN_SPEND_TICKER'),
    spendNetwork: translationString('TR_TRADING_TRADE_HISTORY_EXPORT_COLUMN_SPEND_NETWORK'),
    spendTransactionId: translationString(
        'TR_TRADING_TRADE_HISTORY_EXPORT_COLUMN_SPEND_TRANSACTION_ID',
    ),
    receiveAmount: translationString('TR_TRADING_TRADE_HISTORY_EXPORT_COLUMN_RECEIVE_AMOUNT'),
    receiveTicker: translationString('TR_TRADING_TRADE_HISTORY_EXPORT_COLUMN_RECEIVE_TICKER'),
    receiveNetwork: translationString('TR_TRADING_TRADE_HISTORY_EXPORT_COLUMN_RECEIVE_NETWORK'),
    provider: translationString('TR_TRADING_TRADE_HISTORY_EXPORT_COLUMN_PROVIDER'),
    status: translationString('TR_TRADING_TRADE_HISTORY_EXPORT_COLUMN_STATUS'),
    receiveTransactionId: translationString(
        'TR_TRADING_TRADE_HISTORY_EXPORT_COLUMN_RECEIVE_TRANSACTION_ID',
    ),
    paymentId: translationString('TR_TRADING_TRADE_HISTORY_EXPORT_COLUMN_PAYMENT_ID'),
});

export const useTradingHistoryExport = () => {
    const store = useStore<TradingRootStateWithDeviceAndAccounts>();
    const { dispatch } = useServices(selectDispatch);
    const { translationString } = useTranslation();

    return () => {
        try {
            const state = store.getState();
            const trades = selectDeviceTradingTradesOrderedByDate(state);
            const csvContent = prepareTradingHistoryCsv(getCsvColumnLabels(translationString))(
                state,
                trades,
            );

            triggerWebDownloadFile(
                new Blob([csvContent], { type: CSV_MIME_TYPE }),
                getExportedFileName(CSV_FILE_NAME, 'csv'),
            );
        } catch {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: translationString('TR_EXPORT_FAIL'),
                }),
            );
        }
    };
};
