import React, { useState, useCallback } from 'react';
import { Loader, Dropdown } from '@trezor/components';
import { Translation } from '@suite-components';
import { useActions } from '@suite-hooks';
import { useTranslation } from '@suite-hooks/useTranslation';
import * as notificationActions from '@suite-actions/notificationActions';
import * as transactionActions from '@wallet-actions/transactionActions';
import { Account } from '@wallet-types';
import { isEnabled } from '@suite-utils/features';

export interface Props {
    account: Account;
}

const ExportAction = ({ account }: Props) => {
    const { translationString } = useTranslation();
    const { addToast, fetchAllTransactions, exportTransactions } = useActions({
        addToast: notificationActions.addToast,
        fetchAllTransactions: transactionActions.fetchAllTransactions,
        exportTransactions: transactionActions.exportTransactions,
    });

    const [isExportRunning, setIsExportRunning] = useState(false);
    const runExport = useCallback(
        async type => {
            if (isExportRunning) {
                return;
            }

            setIsExportRunning(true);
            try {
                await fetchAllTransactions(account);
                await exportTransactions(account, type);
            } catch {
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
            fetchAllTransactions,
            account,
            exportTransactions,
            addToast,
            translationString,
        ],
    );

    if (!isEnabled('EXPORT_TRANSACTIONS')) {
        return null;
    }

    if (account.networkType === 'ripple') {
        return null;
    }

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
                        },
                        {
                            key: 'export-pdf',
                            label: <Translation id="TR_EXPORT_AS" values={{ as: 'PDF' }} />,
                            callback: () => runExport('pdf'),
                        },
                        {
                            key: 'export-json',
                            label: <Translation id="TR_EXPORT_AS" values={{ as: 'JSON' }} />,
                            callback: () => runExport('json'),
                        },
                    ],
                },
            ]}
        />
    );
};

export default ExportAction;
