import { useCallback, useState } from 'react';

import { events } from '@suite/analytics';
import { Translation, useTranslation } from '@suite/intl';
import { selectLabelingDataForSelectedAccount } from '@suite/metadata';
import { notificationsActions } from '@suite-common/toast-notifications';
import { getNetwork } from '@suite-common/wallet-config';
import { fetchAllTransactionsForAccountThunk } from '@suite-common/wallet-core';
import { type ExportFileType } from '@suite-common/wallet-types';
import { getTitleForCoinjoinAccount } from '@suite-common/wallet-utils';
import { Dropdown, Note, Text } from '@trezor/components';

import { exportTransactionsThunk } from 'src/actions/wallet/exportTransactionsActions';
import { useDispatch } from 'src/hooks/suite';
import { useSelector } from 'src/hooks/suite/useSelector';
import { useAnalytics } from 'src/support/useAnalytics';
import { type Account } from 'src/types/wallet';

import { type FilterCondition } from './useTransactionFilters';

export interface ExportActionProps {
    account: Account;
    searchQuery: string;
    conditions?: FilterCondition[];
}

export const ExportAction = ({ account, searchQuery, conditions = [] }: ExportActionProps) => {
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
                        conditions,
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
            conditions,
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
        <Dropdown
            placement={{ position: 'bottom', alignment: 'start' }}
            content={
                searchQuery || conditions.length > 0 ? (
                    <Note iconName="checks">
                        <Translation id="TR_EXPORT_SEARCH_FILTER_ACTIVE" />
                    </Note>
                ) : (
                    <Text isDisabled>
                        <Translation id="TR_EXPORT_SEARCH_FILTER_INACTIVE" />
                    </Text>
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
    );
};
