import { useState, useCallback } from 'react';
import { Spinner, Dropdown } from '@trezor/components';
import { analytics, EventType } from '@trezor/suite-analytics';
import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { useTranslation } from 'src/hooks/suite/useTranslation';
import { useSelector } from 'src/hooks/suite/useSelector';
import { notificationsActions } from '@suite-common/toast-notifications';
import { fetchAllTransactionsForAccountThunk } from '@suite-common/wallet-core';
import { exportTransactionsThunk } from 'src/actions/wallet/exportTransactionsActions';
import { ExportFileType } from '@suite-common/wallet-types';
import { Account } from 'src/types/wallet';
import { getTitleForNetwork, getTitleForCoinjoinAccount } from '@suite-common/wallet-utils';
import { selectLabelingDataForSelectedAccount } from 'src/reducers/suite/metadataReducer';
import { AccountLabels } from '@suite-common/metadata-types';

export interface ExportActionProps {
    account: Account;
    searchQuery: string;
    accountMetadata: AccountLabels;
}

export const ExportAction = ({ account, searchQuery, accountMetadata }: ExportActionProps) => {
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
                    fetchAllTransactionsForAccountThunk({
                        accountKey: account.key,
                        noLoading: true,
                    }),
                );
                const accountName = accountLabel || getAccountTitle();
                await dispatch(
                    exportTransactionsThunk({
                        account,
                        accountName,
                        type,
                        searchQuery,
                        accountMetadata,
                    }),
                );
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
        [
            isExportRunning,
            account,
            dispatch,
            translationString,
            getAccountTitle,
            accountLabel,
            searchQuery,
            accountMetadata,
        ],
    );

    const dataTest = '@wallet/accounts/export-transactions';

    if (isExportRunning) {
        return <Spinner size={18} />;
    }

    return (
        <Dropdown
            alignMenu="bottom-right"
            items={[
                {
                    key: 'export',
                    options: [
                        {
                            label: <Translation id="TR_EXPORT_AS" values={{ as: 'CSV' }} />,
                            onClick: () => runExport('csv'),
                            'data-testid': `${dataTest}/csv`,
                        },
                        {
                            label: <Translation id="TR_EXPORT_AS" values={{ as: 'PDF' }} />,
                            onClick: () => runExport('pdf'),
                            'data-testid': `${dataTest}/pdf`,
                        },
                        {
                            label: <Translation id="TR_EXPORT_AS" values={{ as: 'JSON' }} />,
                            onClick: () => runExport('json'),
                            'data-testid': `${dataTest}/json`,
                        },
                    ],
                },
            ]}
            data-testid={`${dataTest}/dropdown`}
        />
    );
};
