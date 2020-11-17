import React, { useMemo } from 'react';
import styled, { css } from 'styled-components';
import { variables, Loader, Card } from '@trezor/components';
import { Translation } from '@suite-components';
import { Section } from '@dashboard-components';
import { useSelector } from '@suite-hooks';
import { groupTransactionsByDate } from '@wallet-utils/transactionUtils';
import { SETTINGS } from '@suite-config';
import { WalletAccountTransaction, Account } from '@wallet-types';
import TransactionItem from './components/TransactionItem';
import Pagination from './components/Pagination';
import TransactionsGroup from './components/TransactionsGroup';

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

const LoaderWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-items: center;
    align-items: center;
    margin: 24px 0px;
`;

const LoaderText = styled.div`
    display: flex;
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    text-align: center;
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
            // actions={} // TODO: add Search and Dropdown with export
        >
            {isLoading ? (
                <LoaderWrapper>
                    <Loader size={28} />
                    <LoaderText>
                        <Translation id="TR_LOADING_TRANSACTIONS" />
                    </LoaderText>
                </LoaderWrapper>
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
