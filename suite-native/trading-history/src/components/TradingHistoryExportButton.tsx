import { useState } from 'react';
import { useSelector, useStore } from 'react-redux';

import {
    type TradingRootStateWithDeviceAndAccounts,
    prepareTradingHistoryCsv,
    selectDeviceHasTradingTrades,
    selectDeviceTradingTradesOrderedByDate,
} from '@suite-common/trading';
import { useAlert } from '@suite-native/alerts';
import { IconButton } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { useToast } from '@suite-native/toasts';
import { exhaustive } from '@trezor/type-utils';

import {
    type ExportTradingHistoryCsvResult,
    exportTradingHistoryCsv,
} from '../exportTradingHistoryCsv';
import { useTradingHistoryCsvColumnLabels } from '../hooks/useTradingHistoryCsvColumnLabels';

export const TradingHistoryExportButton = () => {
    const { showToast } = useToast();
    const { showAlert, hideAlert } = useAlert();
    const { translate } = useTranslate();
    const store = useStore<TradingRootStateWithDeviceAndAccounts>();
    const [isExporting, setIsExporting] = useState(false);
    const hasTrades = useSelector(selectDeviceHasTradingTrades);
    const columnLabels = useTradingHistoryCsvColumnLabels();

    if (!hasTrades) {
        return null;
    }

    const performExport = async () => {
        let result: ExportTradingHistoryCsvResult = { success: false, reason: 'exportFailed' };

        try {
            setIsExporting(true);

            // wait for alert animation to finish before starting the export, 500 ms ought to be enough for anybody.
            await new Promise(resolve => setTimeout(resolve, 500));

            const state = store.getState();
            const trades = selectDeviceTradingTradesOrderedByDate(state);
            const csvContent = prepareTradingHistoryCsv(columnLabels)(state, trades);

            result = await exportTradingHistoryCsv(csvContent);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            // do nothing
        } finally {
            setIsExporting(false);
        }

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
            case 'cancelled':
                // User dismissed the directory picker; nothing to report.
                return;
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

    const handleExport = () => {
        showAlert({
            pictogramVariant: 'success',
            icon: 'downloadSimple',
            title: <Translation id="moduleTrading.tradeHistory.export.button" />,
            primaryButtonTitle: (
                <Translation id="moduleTrading.tradeHistory.export.confirmButton" />
            ),
            onPressPrimaryButton: performExport,
            secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
            onPressSecondaryButton: hideAlert,
        });
    };

    return (
        <IconButton
            iconName="downloadSimple"
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
