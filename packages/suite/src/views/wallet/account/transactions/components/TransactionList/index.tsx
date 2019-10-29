/* eslint-disable radix */
import React, { useMemo } from 'react';
import { FormattedDate, FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import { H5, P, colors, variables } from '@trezor/components';
import { WalletAccountTransaction } from '@wallet-reducers/transactionReducer';
import { groupTransactionsByDate, parseKey } from '@wallet-utils/transactionUtils';
import { SETTINGS } from '@suite-config';
import TransactionItem from '../TransactionItem';
import Pagination from '../Pagination';
import l10nMessages from '../../index.messages';

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

    const slicedTransactions = useMemo(() => transactions.slice(startIndex, stopIndex), [
        transactions,
        startIndex,
        stopIndex,
    ]);
    const transactionsByDate = useMemo(() => groupTransactionsByDate(slicedTransactions), [
        slicedTransactions,
    ]);

    return (
        <Wrapper>
            <Transactions>
                {Object.keys(transactionsByDate).map(dateKey => (
                    <React.Fragment key={dateKey}>
                        <StyledH5>
                            {dateKey === 'pending' ? (
                                <P>
                                    <FormattedMessage {...l10nMessages.TR_PENDING} />
                                </P>
                            ) : (
                                <FormattedDate
                                    value={parseKey(dateKey)}
                                    day="numeric"
                                    month="long"
                                    year="numeric"
                                />
                            )}
                        </StyledH5>
                        {transactionsByDate[dateKey].map((tx: WalletAccountTransaction) => (
                            <TransactionItem
                                key={tx.txid}
                                {...tx}
                                explorerUrl={`${explorerUrl}${tx.txid}`}
                            />
                        ))}
                    </React.Fragment>
                ))}
            </Transactions>
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                isOnLastPage={slicedTransactions.length < SETTINGS.TXS_PER_PAGE}
                onPageSelected={onPageSelected}
            />
        </Wrapper>
    );
};

export default TransactionList;
