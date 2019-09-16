import React, { useState } from 'react';
import { connect } from 'react-redux';
import LayoutAccount from '@wallet-components/LayoutAccount';
import { bindActionCreators } from 'redux';
import * as transactionActions from '@wallet-actions/transactionActions';
import { Loader, colors } from '@trezor/components';
import styled from 'styled-components';
import Title from '@wallet-components/Title';
import TransactionList from '@suite/components/wallet/TransactionList';
import { AppState, Dispatch } from '@suite-types';

const LoaderWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-items: center;
    align-items: center;
`;
const LoaderText = styled.div`
    color: ${colors.TEXT_SECONDARY};
    text-align: center;
`;

const NoTransactions = styled.div`
    color: ${colors.TEXT_SECONDARY};
    text-align: center;
`;

const Transactions = (props: Props) => {
    const { selectedAccount, transactions } = props.wallet;
    const [selectedPage, setSelectedPage] = useState(1);
    if (!selectedAccount || !selectedAccount.account) return null;

    const accountTransactions = transactions.transactions.filter(
        t => t.accountDescriptor === selectedAccount.account!.descriptor,
    );
    const { index = null, size = null, total = null } = selectedAccount.account.page || {};

    const onPageSelected = (page: number) => {
        setSelectedPage(page);
        props.fetchTransactions(
            selectedAccount.account!.descriptor,
            selectedAccount.account!.networkType,
            page,
            size,
        );
    };

    return (
        <LayoutAccount>
            <Title>Transactions</Title>
            {console.log('accountTransactions', accountTransactions)}
            {transactions.isLoading && (
                <LoaderWrapper>
                    <Loader size={40} />
                    <LoaderText>Loading transactions</LoaderText>
                </LoaderWrapper>
            )}
            {accountTransactions.length === 0 && !transactions.isLoading && (
                <LoaderWrapper>
                    <NoTransactions>No transactions :(</NoTransactions>
                </LoaderWrapper>
            )}
            {accountTransactions.length > 0 && (
                <TransactionList
                    transactions={accountTransactions}
                    currentPage={selectedPage}
                    perPage={size}
                    totalPages={total || undefined}
                    onPageSelected={onPageSelected}
                />
            )}
        </LayoutAccount>
    );
};

const mapStateToProps = (state: AppState) => ({
    wallet: state.wallet,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    fetchTransactions: bindActionCreators(transactionActions.fetchTransactions, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Transactions);
