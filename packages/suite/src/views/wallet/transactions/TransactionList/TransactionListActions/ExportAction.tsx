import { useCallback, useState } from 'react';

import { AccountLabels } from '@suite-common/metadata-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { getNetwork } from '@suite-common/wallet-config';
import { fetchAllTransactionsForAccountThunk } from '@suite-common/wallet-core';
import { ExportFileType } from '@suite-common/wallet-types';
import { getTitleForCoinjoinAccount } from '@suite-common/wallet-utils';
import { Dropdown, Note } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';

import { exportTransactionsThunk } from 'src/actions/wallet/exportTransactionsActions';
import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { useSelector } from 'src/hooks/suite/useSelector';
import { useTranslation } from 'src/hooks/suite/useTranslation';
import { selectLabelingDataForSelectedAccount } from 'src/reducers/suite/metadataReducer';
import { Account } from 'src/types/wallet';

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
    const exportTypes = ['csv', 'pdf', 'json'] as const;

    return (
        <Dropdown
            placement={{ position: 'bottom', alignment: 'start' }}
            content={
                <Note iconName={searchQuery ? 'checks' : 'magnifyingGlass'} minWidth={240}>
                    <Translation
                        id={
                            searchQuery
                                ? 'TR_EXPORT_SEARCH_FILTER_ACTIVE'
                                : 'TR_EXPORT_SEARCH_FILTER_INACTIVE'
                        }
                    />
                </Note>
            }
            items={exportTypes.map(type => ({
                label: <Translation id="TR_EXPORT_AS" values={{ as: `.${type}` }} />,
                onClick: () => runExport(type),
                'data-testid': `${dataTest}/${type}`,
                iconRight: 'caretRight',
            }))}
            icon="fileArrowDown"
            isLoading={isExportRunning}
            data-testid={`${dataTest}/dropdown`}
        />
    );
};
