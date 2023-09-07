import { useState, useCallback } from 'react';
import { Spinner, Dropdown } from '@trezor/components';
import { analytics, EventType } from '@trezor/suite-analytics';
import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { SETTINGS } from 'src/config/suite';
import { useTranslation } from 'src/hooks/suite/useTranslation';
import { useSelector } from 'src/hooks/suite/useSelector';
import { notificationsActions } from '@suite-common/toast-notifications';
import { exportTransactionsThunk, fetchTransactionsThunk } from '@suite-common/wallet-core';
import { ExportFileType } from '@suite-common/wallet-types';
import { Account } from 'src/types/wallet';
import { isFeatureFlagEnabled } from '@suite-common/suite-utils';
import { getTitleForNetwork, getTitleForCoinjoinAccount } from '@suite-common/wallet-utils';
import { selectLabelingDataForSelectedAccount } from 'src/reducers/suite/metadataReducer';

export interface ExportActionProps {
    account: Account;
}

export const ExportAction = ({ account }: ExportActionProps) => {
    const [isExportRunning, setIsExportRunning] = useState(false);
    const dispatch = useDispatch();
    const { translationString } = useTranslation();

    const getAccountTitle = useCallback(() => {
        if (account.accountType === 'coinjoin') {
            return translationString(getTitleForCoinjoinAccount(account.symbol));
        }
        return translationString('LABELING_ACCOUNT', {
            networkName: translationString(getTitleForNetwork(account.symbol)),
            index: account.index + 1,
        });
    }, [account, translationString]);

    const { accountLabel } = useSelector(selectLabelingDataForSelectedAccount);

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
                await dispatch(
                    fetchTransactionsThunk({
                        accountKey: account.key,
                        page: 2,
                        perPage: SETTINGS.TXS_PER_PAGE,
                        noLoading: true,
                        recursive: true,
                    }),
                );
                const accountName = accountLabel || getAccountTitle();
                await dispatch(exportTransactionsThunk({ account, accountName, type }));
            } catch (error) {
                console.error('Export transaction failed: ', error);
                dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: translationString('TR_EXPORT_FAIL'),
                    }),
                );
            } finally {
                setIsExportRunning(false);
            }
        },
        [isExportRunning, account, dispatch, translationString, getAccountTitle, accountLabel],
    );

    if (!isFeatureFlagEnabled('EXPORT_TRANSACTIONS')) {
        return null;
    }

    const dataTest = '@wallet/accounts/export-transactions';

    if (isExportRunning) {
        return <Spinner size={18} />;
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
                            onClick: () => runExport('csv'),
                            'data-test': `${dataTest}/csv`,
                        },
                        {
                            key: 'export-pdf',
                            label: <Translation id="TR_EXPORT_AS" values={{ as: 'PDF' }} />,
                            onClick: () => runExport('pdf'),
                            'data-test': `${dataTest}/pdf`,
                        },
                        {
                            key: 'export-json',
                            label: <Translation id="TR_EXPORT_AS" values={{ as: 'JSON' }} />,
                            onClick: () => runExport('json'),
                            'data-test': `${dataTest}/json`,
                        },
                    ],
                },
            ]}
            data-test={`${dataTest}/dropdown`}
        />
    );
};
