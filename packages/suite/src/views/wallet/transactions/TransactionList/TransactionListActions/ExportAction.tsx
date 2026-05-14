import { useCallback, useState } from 'react';

import { events } from '@suite/analytics';
import { Translation, useTranslation } from '@suite/intl';
import { selectLabelingDataForSelectedAccount } from '@suite/metadata';
import { notificationsActions } from '@suite-common/toast-notifications';
import { getNetwork } from '@suite-common/wallet-config';
import { fetchAllTransactionsForAccountThunk } from '@suite-common/wallet-core';
import { type ExportFileType } from '@suite-common/wallet-types';
import { getTitleForCoinjoinAccount } from '@suite-common/wallet-utils';
import { Dropdown, Note, Tooltip } from '@trezor/components';

import { exportTransactionsThunk } from 'src/actions/wallet/exportTransactionsActions';
import { useDispatch } from 'src/hooks/suite';
import { useSelector } from 'src/hooks/suite/useSelector';
import { useAnalytics } from 'src/support/useAnalytics';
import { type Account } from 'src/types/wallet';

export interface ExportActionProps {
    account: Account;
    searchQuery: string;
}

export const ExportAction = ({ account, searchQuery }: ExportActionProps) => {
    const [isExportRunning, setIsExportRunning] = useState(false);
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const { translationString } = useTranslation();

    const getAccountTitle = useCallback(() => {
        if (account.accountType === 'coinjoin') {
            return translationString(getTitleForCoinjoinAccount(account.symbol));
        }

        return translationString('LABELING_ACCOUNT', {
            networkName: getNetwork(account.symbol).name,
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
                type: events.accountsTransactionsExportEvent.name,
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
            analytics,
            account,
            dispatch,
            accountLabel,
            getAccountTitle,
            searchQuery,
            translationString,
        ],
    );

    const dataTest = '@wallet/accounts/export-transactions';
    const exportTypes = ['csv', 'pdf', 'json'] as const;

    return (
        <Tooltip content={<Translation id="TR_EXPORT_TO_FILE" />}>
            <Dropdown
                placement={{ position: 'bottom', alignment: 'start' }}
                content={
                    searchQuery ? (
                        <Note iconName="checks">
                            <Translation
                                id={
                                    searchQuery
                                        ? 'TR_EXPORT_SEARCH_FILTER_ACTIVE'
                                        : 'TR_EXPORT_SEARCH_FILTER_INACTIVE'
                                }
                            />
                        </Note>
                    ) : (
                        <Note iconName="info" priority="secondary">
                            <Translation id="TR_EXPORT_SEARCH_FILTER_INACTIVE" />
                        </Note>
                    )
                }
                items={exportTypes.map(type => ({
                    label: <Translation id="TR_EXPORT_AS" values={{ as: `.${type}` }} />,
                    onClick: () => runExport(type),
                    'data-testid': `${dataTest}/${type}`,
                }))}
                minWidth={240}
                iconName="fileArrowDown"
                isLoading={isExportRunning}
                data-testid={`${dataTest}/dropdown`}
            />
        </Tooltip>
    );
};
