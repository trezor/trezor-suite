import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import { Loader, colors } from '@trezor/components';
import * as transactionActions from '@wallet-actions/transactionActions';
import LayoutAccount from '@wallet-components/LayoutAccount';
import AccountName from '@wallet-components/AccountName';
import Content from '@wallet-components/Content';
import { getAccountTransactions } from '@wallet-utils/accountUtils';
import { SETTINGS } from '@suite-config';
import { AppState, Dispatch } from '@suite-types';
import TransactionList from './components/TransactionList';
import l10nMessages from './index.messages';

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
    const { selectedAccount, transactions } = props;
    const [selectedPage, setSelectedPage] = useState(1);
    if (!selectedAccount.account) {
        const { loader, exceptionPage } = selectedAccount;
        return (
            <LayoutAccount title="Transactions">
                <Content loader={loader} exceptionPage={exceptionPage} isLoading />
            </LayoutAccount>
        );
    }

    const explorerUrl = selectedAccount.network ? selectedAccount.network.explorer.tx : undefined;

    const accountTransactions = getAccountTransactions(
        transactions.transactions,
        selectedAccount.account,
    );
    const { size = undefined, total = undefined } = selectedAccount.account.page || {};

    const onPageSelected = (page: number) => {
        setSelectedPage(page);
        props.fetchTransactions(selectedAccount.account!, page, size);
    };

    const accountNameMessage =
        selectedAccount.account && selectedAccount.account.networkType === 'ethereum'
            ? l10nMessages.TR_TRANSACTIONS_AND_TOKENS
            : l10nMessages.TR_TRANSACTIONS;

    return (
        <LayoutAccount title="Transactions">
            <AccountName account={selectedAccount.account} message={accountNameMessage} />
            {transactions.isLoading && (
                <LoaderWrapper>
                    <Loader size={40} />
                    <LoaderText>
                        <FormattedMessage {...l10nMessages.TR_LOADING_TRANSACTIONS} />
                    </LoaderText>
                </LoaderWrapper>
            )}
            {accountTransactions.length === 0 && !transactions.isLoading && (
                <LoaderWrapper>
                    <NoTransactions>
                        <FormattedMessage {...l10nMessages.TR_NO_TRANSACTIONS} />
                    </NoTransactions>
                </LoaderWrapper>
            )}
            {accountTransactions.length > 0 && (
                <TransactionList
                    explorerUrl={explorerUrl}
                    transactions={accountTransactions}
                    currentPage={selectedPage}
                    totalPages={total}
                    onPageSelected={onPageSelected}
                    perPage={SETTINGS.TXS_PER_PAGE}
                />
            )}
        </LayoutAccount>
    );
};

const mapStateToProps = (state: AppState) => ({
    selectedAccount: state.wallet.selectedAccount,
    transactions: state.wallet.transactions,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    fetchTransactions: bindActionCreators(transactionActions.fetchTransactions, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Transactions);
