/* eslint-disable radix */
import React, { useMemo } from 'react';
import { FormattedDate } from 'react-intl';
import styled from 'styled-components';
import { H5, P, colors, variables } from '@trezor/components';
import { WalletAccountTransaction } from '@wallet-reducers/transactionReducer';
import { SETTINGS } from '@suite-config';
import TransactionItem from '../TransactionItem';
import Pagination from '../Pagination';

const Wrapper = styled.div``;

const Transactions = styled.div``;

const StyledH5 = styled(H5)`
    font-size: 1em;
    color: ${colors.TEXT_SECONDARY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    padding-top: 20px;
    margin: 0 -35px;
    padding-left: 35px;
    padding-right: 35px;
    background: ${colors.LANDING};
    border-top: 1px solid ${colors.INPUT_BORDER};
`;

interface Props {
    explorerUrl?: string;
    transactions: WalletAccountTransaction[];
    currentPage: number;
    totalPages?: number;
    perPage: number;
    onPageSelected: (page: number) => void;
}

const TransactionList = ({
    explorerUrl,
    transactions,
    currentPage,
    totalPages,
    onPageSelected,
    perPage,
}: Props) => {
    const startIndex = (currentPage - 1) * perPage;
    const stopIndex = startIndex + perPage;
    const splitTransactionsByDate = (transactions: WalletAccountTransaction[]) => {
        const r: { [key: string]: WalletAccountTransaction[] } = {};
        transactions.forEach(item => {
            if (item.blockTime) {
                let date = 'pending';
                if (item.blockTime > 0) {
                    const d = new Date(item.blockTime * 1000);
                    date = d.toLocaleDateString();
                }
                if (!r[date]) {
                    r[date] = [];
                }
                r[date].push(item);
            }
        });
        return r;
    };
    const [transactionsByDate, transactionsCount] = useMemo(() => {
        const t = transactions.slice(startIndex, stopIndex);
        return [splitTransactionsByDate(t), t.length];
    }, [transactions, startIndex, stopIndex]);

    return (
        <Wrapper>
            <Transactions>
                {Object.keys(transactionsByDate).map(date => {
                    let currentDate = 0;
                    const TransactionItems = (
                        <>
                            {transactionsByDate[date].map((tx: WalletAccountTransaction) => {
                                const txUrl = `${explorerUrl}${tx.txid}`;
                                if (tx.blockTime) {
                                    currentDate = tx.blockTime;
                                }
                                return (
                                    <TransactionItem key={tx.txid} {...tx} explorerUrl={txUrl} />
                                );
                            })}
                        </>
                    );
                    return (
                        <React.Fragment key={date}>
                            <StyledH5>
                                {currentDate > 0 && (
                                    <FormattedDate
                                        value={new Date(currentDate * 1000)}
                                        day="numeric"
                                        month="long"
                                        year="numeric"
                                    />
                                )}
                                {currentDate === 0 && <P>(pending)</P>}
                            </StyledH5>
                            {TransactionItems}
                        </React.Fragment>
                    );
                })}
            </Transactions>
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                isOnLastPage={transactionsCount < SETTINGS.TXS_PER_PAGE}
                onPageSelected={onPageSelected}
            />
        </Wrapper>
    );
};

export default TransactionList;
