import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import { Loader, colors } from '@trezor/components';
import * as transactionActions from '@wallet-actions/transactionActions';
import LayoutAccount from '@wallet-components/LayoutAccount';
import Title from '@wallet-components/Title';
import Content from '@wallet-components/Content';
import TransactionList from '@wallet-components/TransactionList';
import { getAccountTransactions } from '@suite-utils/reducerUtils';
import { SETTINGS } from '@suite-config';
import { AppState, Dispatch } from '@suite-types';
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
    const { selectedAccount, transactions } = props.wallet;
    const [selectedPage, setSelectedPage] = useState(1);
    if (!selectedAccount.account) {
        const { loader, exceptionPage } = selectedAccount;
        return (
            <LayoutAccount>
                <Content loader={loader} exceptionPage={exceptionPage} isLoading />
            </LayoutAccount>
        );
    }

    const accountTransactions = getAccountTransactions(
        transactions.transactions,
        selectedAccount.account,
    );
    const { size = undefined, total = undefined } = selectedAccount.account.page || {};

    const onPageSelected = (page: number) => {
        setSelectedPage(page);
        props.fetchTransactions(selectedAccount.account!, page, size);
    };

    return (
        <LayoutAccount isTransaction>
            <Title>
                <FormattedMessage {...l10nMessages.TR_TRANSACTIONS} />
            </Title>
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
