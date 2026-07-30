import { useState } from 'react';
import { useSelector, useStore } from 'react-redux';

import {
    type TradingRootStateWithDeviceAndAccounts,
    prepareTradingHistoryCsv,
    selectDeviceHasTradingTrades,
    selectDeviceTradingTradesOrderedByDate,
} from '@suite-common/trading';
import { IconButton } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { useToast } from '@suite-native/toasts';
import { exhaustive } from '@trezor/type-utils';

import { exportTradingHistoryCsv } from '../exportTradingHistoryCsv';

export const TradingHistoryExportButton = () => {
    const { showToast } = useToast();
    const { translate } = useTranslate();
    const store = useStore<TradingRootStateWithDeviceAndAccounts>();
    const [isExporting, setIsExporting] = useState(false);
    const hasTrades = useSelector(selectDeviceHasTradingTrades);

    if (!hasTrades) {
        return null;
    }

    const handleExport = async () => {
        setIsExporting(true);

        const state = store.getState();
        const trades = selectDeviceTradingTradesOrderedByDate(state);
        const csvContent = prepareTradingHistoryCsv(state, trades);

        const result = await exportTradingHistoryCsv(csvContent);

        setIsExporting(false);

        if (result.success) {
            showToast({
                intent: 'neutral',
                icon: 'check',
                message: (
                    <Translation id="moduleTrading.tradeHistory.export.exportSuccessfulToast" />
                ),
            });

            return;
        }

        switch (result.reason) {
            case 'exportFailed':
                showToast({
                    intent: 'critical',
                    message: (
                        <Translation id="moduleTrading.tradeHistory.export.exportFailedToast" />
                    ),
                });

                return;
            case 'fileSavingNotSupported':
                showToast({
                    intent: 'critical',
                    message: (
                        <Translation id="moduleTrading.tradeHistory.export.fileSavingNotSupportedToast" />
                    ),
                });

                return;
            default:
                exhaustive(result.reason);
        }
    };

    return (
        <IconButton
            iconName="shareNetwork"
            intent="neutral"
            priority="secondary"
            size="medium"
            isLoading={isExporting}
            onPress={handleExport}
            accessibilityLabel={translate('moduleTrading.tradeHistory.export.button')}
            testID="@trading/history/export-button"
        />
    );
};
