import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Translation } from '@suite-components/Translation';
import styled from 'styled-components';
import { Loader, colors } from '@trezor/components-v2';
import * as transactionActions from '@wallet-actions/transactionActions';
import LayoutAccount from '@wallet-components/LayoutAccount';
// import AccountName from '@wallet-components/AccountName';
import Content from '@wallet-components/Content';
import { getAccountTransactions } from '@wallet-utils/accountUtils';
import { SETTINGS } from '@suite-config';
import { AppState, Dispatch } from '@suite-types';
import TransactionList from './components/TransactionList';
import messages from '@suite/support/messages';
import NoTransactions from './components/NoTransactions';
import PricePanel from './components/PricePanel';

const LoaderWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-items: center;
    align-items: center;
`;
const LoaderText = styled.div`
    color: ${colors.BLACK50};
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

    const descriptor = selectedAccount.account?.descriptor;
    const symbol = selectedAccount.account?.symbol;
    useEffect(() => {
        // reset page on account change
        setSelectedPage(1);
    }, [descriptor, symbol]);

    if (selectedAccount.status !== 'loaded') {
        const { loader, exceptionPage } = selectedAccount;
        return (
            <LayoutAccount title="Transactions">
                <Content loader={loader} exceptionPage={exceptionPage} isLoading />
            </LayoutAccount>
        );
    }

    const { account, network } = selectedAccount;

    const accountTransactions = getAccountTransactions(transactions.transactions, account);
    const { size = undefined, total = undefined } = account.page || {};

    const onPageSelected = (page: number) => {
        setSelectedPage(page);
        props.fetchTransactions(account, page, size);
    };

    return (
        <LayoutAccount title="Transactions">
            <PricePanel account={account} />
            {transactions.isLoading && (
                <LoaderWrapper>
                    <Loader size={40} />
                    <LoaderText>
                        <Translation {...messages.TR_LOADING_TRANSACTIONS} />
                    </LoaderText>
                </LoaderWrapper>
            )}
            {accountTransactions.length === 0 && !transactions.isLoading && <NoTransactions />}
            {accountTransactions.length > 0 && (
                <TransactionList
                    explorerUrl={network.explorer.tx}
                    transactions={accountTransactions}
                    currentPage={selectedPage}
                    totalPages={total}
                    onPageSelected={onPageSelected}
                    perPage={SETTINGS.TXS_PER_PAGE}
                    symbol={account.symbol}
                />
            )}
        </LayoutAccount>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Transactions);
