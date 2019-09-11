import React, { useState } from 'react';
import { connect } from 'react-redux';
import LayoutAccount from '@wallet-components/LayoutAccount';
import { bindActionCreators } from 'redux';
import * as transactionActions from '@wallet-actions/transactionActions';
import { Button, Loader, colors, Icon } from '@trezor/components';
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
interface Props {
    suite: AppState['suite'];
    router: AppState['router'];
    wallet: AppState['wallet'];
    add: typeof transactionActions.add;
    remove: typeof transactionActions.remove;
    update: typeof transactionActions.update;
    getFromStorage: typeof transactionActions.fetchFromStorage;
}

const Transactions = (props: Props) => {
    const { selectedAccount, transactions } = props.wallet;
    const [selectedPage, setSelectedPage] = useState(1);
    if (!selectedAccount || !selectedAccount.account) return null;
    const { index = null, size = null, total = null } = selectedAccount.account.page || {};

    const onPageSelected = (page: number) => {
        setSelectedPage(page);
    };

    return (
        <LayoutAccount>
            <Title>Transactions</Title>
            {transactions.isLoading && (
                <LoaderWrapper>
                    <Loader size={40} />
                    <LoaderText>Loading transactions</LoaderText>
                </LoaderWrapper>
            )}
            {transactions.transactions.length === 0 && !transactions.isLoading && (
                <LoaderWrapper>
                    <NoTransactions>No transactions :(</NoTransactions>
                </LoaderWrapper>
            )}
            {transactions.transactions.length > 0 && (
                <TransactionList
                    transactions={props.wallet.transactions.transactions}
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
    suite: state.suite,
    router: state.router,
    wallet: state.wallet,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    add: bindActionCreators(transactionActions.add, dispatch),
    remove: bindActionCreators(transactionActions.remove, dispatch),
    update: bindActionCreators(transactionActions.update, dispatch),
    fetchFromStorage: bindActionCreators(transactionActions.fetchFromStorage, dispatch),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Transactions);
