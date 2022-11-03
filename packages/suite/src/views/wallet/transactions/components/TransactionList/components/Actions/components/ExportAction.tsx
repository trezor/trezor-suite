import React, { useState, useCallback } from 'react';
import { Loader, Dropdown } from '@trezor/components';
import { analytics, EventType } from '@trezor/suite-analytics';
import { Translation } from '@suite-components';
import { useActions } from '@suite-hooks';
import { SETTINGS } from '@suite-config';
import { useTranslation } from '@suite-hooks/useTranslation';
import { notificationsActions } from '@suite-common/toast-notifications';
import { exportTransactionsThunk, fetchTransactionsThunk } from '@suite-common/wallet-core';
import { ExportFileType } from '@suite-common/wallet-types';
import { Account } from '@wallet-types';
import { isFeatureFlagEnabled } from '@suite-common/suite-utils';
import { getTitleForNetwork } from '@suite-common/wallet-utils';

export interface ExportActionProps {
    account: Account;
}

export const ExportAction = ({ account }: ExportActionProps) => {
    const { translationString } = useTranslation();
    const { addToast, fetchTransactions, exportTransactions } = useActions({
        addToast: notificationsActions.addToast,
        fetchTransactions: fetchTransactionsThunk,
        exportTransactions: exportTransactionsThunk,
    });

    const [isExportRunning, setIsExportRunning] = useState(false);
    const runExport = useCallback(
        async (type: ExportFileType) => {
            if (isExportRunning) {
                return;
            }

            analytics.report({
                type: EventType.AccountsTransactionsExport,
                payload: {
                    format: type,
                    symbol: account.symbol,
                },
            });

            setIsExportRunning(true);
            try {
                await fetchTransactions({
                    accountKey: account.key,
                    page: 2,
                    perPage: SETTINGS.TXS_PER_PAGE,
                    noLoading: true,
                    recursive: true,
                });
                const accountName =
                    account.metadata.accountLabel ||
                    `${translationString(getTitleForNetwork(account.symbol))} #${
                        account.index + 1
                    }`;
                await exportTransactions({ account, accountName, type });
            } catch (error) {
                console.error('Export transaction failed: ', error);
                addToast({
                    type: 'error',
                    error: translationString('TR_EXPORT_FAIL'),
                });
            } finally {
                setIsExportRunning(false);
            }
        },
        [
            isExportRunning,
            fetchTransactions,
            account,
            exportTransactions,
            addToast,
            translationString,
        ],
    );

    if (!isFeatureFlagEnabled('EXPORT_TRANSACTIONS')) {
        return null;
    }

    const dataTest = '@wallet/accounts/export-transactions';

    if (isExportRunning) {
        return <Loader size={18} />;
    }

    return (
        <Dropdown
            alignMenu="right"
            items={[
                {
                    key: 'export',
                    options: [
                        {
                            key: 'export-csv',
                            label: <Translation id="TR_EXPORT_AS" values={{ as: 'CSV' }} />,
                            callback: () => runExport('csv'),
                            'data-test': `${dataTest}/csv`,
                        },
                        {
                            key: 'export-pdf',
                            label: <Translation id="TR_EXPORT_AS" values={{ as: 'PDF' }} />,
                            callback: () => runExport('pdf'),
                            'data-test': `${dataTest}/pdf`,
                        },
                        {
                            key: 'export-json',
                            label: <Translation id="TR_EXPORT_AS" values={{ as: 'JSON' }} />,
                            callback: () => runExport('json'),
                            'data-test': `${dataTest}/json`,
                        },
                    ],
                },
            ]}
            data-test={`${dataTest}/dropdown`}
        />
    );
};
