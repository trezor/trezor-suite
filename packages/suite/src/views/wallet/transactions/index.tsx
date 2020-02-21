import React, { useState, useEffect } from 'react';
import { Translation } from '@suite-components/Translation';
import styled from 'styled-components';
import { colors, Loader } from '@trezor/components';
import { WalletLayout } from '@wallet-components';
import { getAccountTransactions } from '@wallet-utils/accountUtils';
import { SETTINGS } from '@suite-config';
import TransactionList from './components/TransactionList';
import messages from '@suite/support/messages';
import NoTransactions from './components/NoTransactions';
import PricePanel from './components/PricePanel';

import { Props } from './Container';

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

export default (props: Props) => {
    const { selectedAccount, transactions } = props;
    const [selectedPage, setSelectedPage] = useState(1);

    const descriptor = selectedAccount.account?.descriptor;
    const symbol = selectedAccount.account?.symbol;
    useEffect(() => {
        // reset page on account change
        setSelectedPage(1);
    }, [descriptor, symbol]);

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

    return (
        <WalletLayout title="Transactions" account={props.selectedAccount}>
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
        </WalletLayout>
    );
};
