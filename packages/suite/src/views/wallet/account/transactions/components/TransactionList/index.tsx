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
            let key = 'pending';
            if (item.blockHeight && (item.blockTime || 0) > 0) {
                const d = new Date((item.blockTime || 0) * 1000);
                key = `${d.getFullYear()}-${d.getMonth()}-${d.getDay()}`;
            }
            if (!r[key]) {
                r[key] = [];
            }
            r[key].push(item);
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
                    const parts = date.split('-');
                    const d = new Date(Number(parts[0]), Number(parts[1]), Number(parts[2]));
                    return (
                        <React.Fragment key={date}>
                            <StyledH5>
                                {date === 'pending' ? (
                                    <P>Pending</P>
                                ) : (
                                    <FormattedDate
                                        value={d}
                                        day="numeric"
                                        month="long"
                                        year="numeric"
                                    />
                                )}
                            </StyledH5>
                            {transactionsByDate[date].map((tx: WalletAccountTransaction) => (
                                <TransactionItem
                                    key={tx.txid}
                                    {...tx}
                                    explorerUrl={`${explorerUrl}${tx.txid}`}
                                />
                            ))}
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
