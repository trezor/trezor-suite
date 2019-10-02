/* eslint-disable radix */
import React, { useMemo } from 'react';
import { FormattedDate } from 'react-intl';
import styled from 'styled-components';
import Pagination from '@wallet-components/Pagination';
import TransactionItem from '@suite/components/wallet/TransactionItem';
import { WalletAccountTransaction } from '@suite/reducers/wallet/transactionReducer';
import { SETTINGS } from '@suite/config/suite';
import { H5, colors, variables } from '@trezor/components';

const Wrapper = styled.div``;

const Transactions = styled.div``;

const StyledH5 = styled(H5)`
    font-size: 1em;
    color: ${colors.TEXT_SECONDARY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface Props {
    transactions: WalletAccountTransaction[];
    currentPage: number;
    totalPages?: number;
    perPage: number;
    onPageSelected: (page: number) => void;
}

const TransactionList = ({
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
                const d = new Date(item.blockTime * 1000);
                const date = d.toLocaleDateString();
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
                    const d = date.split('/');
                    return (
                        <>
                            <StyledH5>
                                <FormattedDate
                                    value={Date.UTC(
                                        parseInt(d[2]),
                                        parseInt(d[1]) - 1,
                                        parseInt(d[0]),
                                    )}
                                    day="numeric"
                                    month="long"
                                    year="numeric"
                                />
                            </StyledH5>
                            {transactionsByDate[date].map(tx => {
                                return <TransactionItem key={tx.txid} {...tx} />;
                            })}
                        </>
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
