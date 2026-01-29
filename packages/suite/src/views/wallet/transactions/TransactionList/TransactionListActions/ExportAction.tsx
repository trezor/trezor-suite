import { useCallback, useState } from 'react';

import { EventType } from '@suite/analytics';
import { Translation, useTranslation } from '@suite/intl';
import { AccountLabels } from '@suite-common/metadata-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { getNetwork } from '@suite-common/wallet-config';
import { fetchAllTransactionsForAccountThunk } from '@suite-common/wallet-core';
import { ExportFileType } from '@suite-common/wallet-types';
import { getTitleForCoinjoinAccount } from '@suite-common/wallet-utils';
import { Dropdown, Note, Text } from '@trezor/components';

import { exportTransactionsThunk } from 'src/actions/wallet/exportTransactionsActions';
import { useDispatch } from 'src/hooks/suite';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectLabelingDataForSelectedAccount } from 'src/reducers/suite/metadataReducer';
import { useAnalytics } from 'src/support/useAnalytics';
import { Account } from 'src/types/wallet';

export interface ExportActionProps {
    account: Account;
    searchQuery: string;
    accountMetadata: AccountLabels;
}

export const ExportAction = ({ account, searchQuery, accountMetadata }: ExportActionProps) => {
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
            analytics,
            account,
            dispatch,
            accountLabel,
            getAccountTitle,
            searchQuery,
            accountMetadata,
            translationString,
        ],
    );

    const dataTest = '@wallet/accounts/export-transactions';
    const exportTypes = ['csv', 'pdf', 'json'] as const;

    return (
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
                    <Text variant="disabled">
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
