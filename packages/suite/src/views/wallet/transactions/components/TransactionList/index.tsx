import React, { useMemo, useState, useCallback } from 'react';
import { saveAs } from 'file-saver';
import TrezorConnect, { AccountTransaction } from 'trezor-connect';
import styled, { css } from 'styled-components';
import { Loader, Card, Dropdown } from '@trezor/components';
import { Stack } from '@suite-components/Skeleton';
import { Translation } from '@suite-components';
import { Section } from '@dashboard-components';
import { useActions, useSelector } from '@suite-hooks';
import { useTranslation } from '@suite-hooks/useTranslation';
import { groupTransactionsByDate } from '@wallet-utils/transactionUtils';
import { addToast } from '@suite-actions/notificationActions';
import { SETTINGS } from '@suite-config';
import { WalletAccountTransaction, Account } from '@wallet-types';
import { isEnabled } from '@suite-utils/features';
import { range } from '@suite-utils/array';
// @ts-ignore - Not sure why it can't find the worker but the path is correct?!
// eslint-disable-next-line import/no-webpack-loader-syntax
import ExportWorker from 'worker-loader?filename=static/[hash].worker.js!../../../../../workers/export.worker';

import TransactionItem from './components/TransactionItem';
import Pagination from './components/Pagination';
import TransactionsGroup from './components/TransactionsGroup';
import SkeletonTransactionItem from './components/SkeletonTransactionItem';

const StyledCard = styled(Card)<{ isPending: boolean }>`
    flex-direction: column;
    padding: 0px 24px;
    ${props =>
        props.isPending &&
        css`
            border-left: 6px solid ${props => props.theme.TYPE_ORANGE};
            padding-left: 18px;
        `}
`;

const StyledSection = styled(Section)`
    margin-bottom: 20px;
`;

const PaginationWrapper = styled.div`
    margin-top: 20px;
`;

interface Props {
    transactions: WalletAccountTransaction[];
    currentPage: number;
    totalPages?: number;
    perPage: number;
    symbol: WalletAccountTransaction['symbol'];
    isLoading?: boolean;
    onPageSelected: (page: number) => void;
    account: Account;
}

const TransactionList = ({
    transactions,
    currentPage,
    totalPages,
    onPageSelected,
    perPage,
    isLoading,
    account,
    ...props
}: Props) => {
    const ref = React.createRef<HTMLDivElement>();
    const localCurrency = useSelector(state => state.wallet.settings.localCurrency);
    const startIndex = (currentPage - 1) * perPage;
    const stopIndex = startIndex + perPage;

    const slicedTransactions = useMemo(() => transactions.slice(startIndex, stopIndex), [
        transactions,
        startIndex,
        stopIndex,
    ]);

    const transactionsByDate = useMemo(() => groupTransactionsByDate(slicedTransactions), [
        slicedTransactions,
    ]);

    const { translationString } = useTranslation();
    const { addNotification } = useActions({
        addNotification: addToast,
    });
    const [isExportRunning, setIsExportRunning] = useState(false);
    const runExport = useCallback(
        async type => {
            // Don't run again if already running
            if (isExportRunning) {
                return;
            }

            // Set as in running
            setIsExportRunning(true);

            const exportTransactions: AccountTransaction[] = [];
            const pages = range(1, account.history.total);
            const promises = pages.map(p =>
                TrezorConnect.getAccountInfo({
                    descriptor: account.descriptor,
                    coin: account.symbol,
                    details: 'txs',
                    page: p,
                }),
            );
            const results = await Promise.all(promises);
            results.forEach(r => {
                if (!r.success) {
                    addNotification({
                        type: 'error',
                        error: translationString('TR_EXPORT_FAIL'),
                    });
                    setIsExportRunning(false);
                    return;
                }

                if (r.payload.history.transactions) {
                    exportTransactions.push(...r.payload.history.transactions);
                }
            });

            // Delegate the formatting/document generation work to a service worker
            const worker = new ExportWorker();
            worker.postMessage({
                coin: account.symbol,
                type,
                transactions: exportTransactions,
            });

            // Handle the response from the worker (fired when the file is available)
            const handleMessage = (event: MessageEvent) => {
                saveAs(event.data, `export-${account.symbol}-${+new Date()}.${type}`);
                setIsExportRunning(false);
            };

            worker.addEventListener('message', handleMessage);
            return () => {
                worker.removeEventListener('message', handleMessage);
                worker.terminate();
            };
        },
        [
            isExportRunning,
            account.descriptor,
            account.symbol,
            account.history,
            addNotification,
            translationString,
        ],
    );

    const exportMenu = useMemo(() => {
        // Check if the flag is enabled
        if (!isEnabled('EXPORT_TRANSACTIONS')) {
            return;
        }

        // Don't display for Ripple (for now)
        if (account.networkType === 'ripple') {
            return;
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
    }, [isExportRunning, runExport, account.networkType]);

    // if totalPages is 1 do not render pagination
    // if totalPages is undefined check current page and number of txs (e.g. XRP)
    // Edge case: if there is exactly 25 txs, pagination will be displayed
    const isOnLastPage = slicedTransactions.length < SETTINGS.TXS_PER_PAGE;
    const shouldShowRipplePagination = !(currentPage === 1 && isOnLastPage);
    const showPagination = totalPages ? totalPages > 1 : shouldShowRipplePagination;

    return (
        <StyledSection
            ref={ref}
            heading={<Translation id="TR_ALL_TRANSACTIONS" />}
            actions={exportMenu}
        >
            {isLoading ? (
                <Stack col childMargin="0px 0px 16px 0px">
                    <SkeletonTransactionItem />
                    <SkeletonTransactionItem />
                    <SkeletonTransactionItem />
                </Stack>
            ) : (
                Object.keys(transactionsByDate).map(dateKey => {
                    const isPending = dateKey === 'pending';
                    return (
                        <TransactionsGroup
                            key={dateKey}
                            dateKey={dateKey}
                            symbol={props.symbol}
                            transactions={transactionsByDate[dateKey]}
                            localCurrency={localCurrency}
                        >
                            <StyledCard isPending={isPending}>
                                {transactionsByDate[dateKey].map((tx: WalletAccountTransaction) => (
                                    <TransactionItem
                                        key={tx.txid}
                                        transaction={tx}
                                        isPending={isPending}
                                        accountMetadata={account.metadata}
                                        accountKey={account.key}
                                    />
                                ))}
                            </StyledCard>
                        </TransactionsGroup>
                    );
                })
            )}
            {showPagination && (
                <PaginationWrapper>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        isOnLastPage={isOnLastPage}
                        onPageSelected={(page: number) => {
                            onPageSelected(page);
                            if (ref.current) {
                                ref.current.scrollIntoView();
                            }
                        }}
                    />
                </PaginationWrapper>
            )}
        </StyledSection>
    );
};

export default TransactionList;
