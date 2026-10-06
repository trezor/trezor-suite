import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { selectDeviceHasTradingTrades } from '@suite-common/trading';
import { Button, Tooltip } from '@trezor/components';
import { DownloadSimpleIcon } from '@trezor/icons';

import { useTradingHistoryExport } from './useTradingHistoryExport';

export const TradingTransactionsExportButton = () => {
    const hasTrades = useSelector(selectDeviceHasTradingTrades);

    const exportTradeHistory = useTradingHistoryExport();

    if (!hasTrades) {
        return null;
    }

    return (
        <Tooltip content={<Translation id="TR_TRADING_TRADE_HISTORY_EXPORT_TOOLTIP" />}>
            <Button
                intent="neutral"
                priority="secondary"
                iconLeft={DownloadSimpleIcon}
                onClick={exportTradeHistory}
                data-testid="@trading/transactions/export-button"
            >
                <Translation id="TR_TRADING_TRADE_HISTORY_EXPORT_BUTTON" />
            </Button>
        </Tooltip>
    );
};
