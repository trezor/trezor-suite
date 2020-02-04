import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Translation } from '@suite-components/Translation';
import styled from 'styled-components';
import { colors, Loader } from '@trezor/components-v2';
import * as transactionActions from '@wallet-actions/transactionActions';
import { WalletLayout } from '@wallet-components';
// import AccountName from '@wallet-components/AccountName';
import { getAccountTransactions } from '@wallet-utils/accountUtils';
import { SETTINGS } from '@suite-config';
import { AppState, Dispatch } from '@suite-types';
import TransactionList from './components/TransactionList';
import messages from '@suite/support/messages';
import NoTransactions from './components/NoTransactions';

const LoaderWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-items: center;
    align-items: center;
`;
const LoaderText = styled.div`
    color: ${colors.BLACK0};
    text-align: center;
`;

const mapStateToProps = (state: AppState) => ({
    selectedAccount: state.wallet.selectedAccount,
    transactions: state.wallet.transactions,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    fetchTransactions: bindActionCreators(transactionActions.fetchTransactions, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const Transactions = (props: Props) => {
    const { selectedAccount, transactions } = props;
    const [selectedPage, setSelectedPage] = useState(1);

    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="Transactions" account={props.selectedAccount} />;
    }

    const { account, network } = selectedAccount;

    const accountTransactions = getAccountTransactions(transactions.transactions, account);
    const { size = undefined, total = undefined } = account.page || {};

    const onPageSelected = (page: number) => {
        setSelectedPage(page);
        props.fetchTransactions(account, page, size);
    };

    // const accountNameMessage =
    //     account.networkType === 'ethereum'
    //         ? messages.TR_TRANSACTIONS_AND_TOKENS
    //         : messages.TR_TRANSACTIONS;

    return (
        <WalletLayout title="Transactions" account={props.selectedAccount}>
            {/* <AccountName account={account} message={accountNameMessage} /> */}
            {transactions.isLoading && (
                <LoaderWrapper>
                    <Loader size={40} />
                    <LoaderText>
                        <Translation {...messages.TR_LOADING_TRANSACTIONS} />
                    </LoaderText>
                </LoaderWrapper>
            )}
            {accountTransactions.length === 0 && !transactions.isLoading && (
                <NoTransactions account={account} />
            )}
            {accountTransactions.length > 0 && (
                <TransactionList
                    explorerUrl={network.explorer.tx}
                    transactions={accountTransactions}
                    currentPage={selectedPage}
                    totalPages={total}
                    onPageSelected={onPageSelected}
                    perPage={SETTINGS.TXS_PER_PAGE}
                />
            )}
        </WalletLayout>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Transactions);
