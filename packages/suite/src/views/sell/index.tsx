import React from 'react';
import { Select, H2, P } from '@trezor/components';
import { useExchange } from '@exchange-hooks';
import { WalletLayout } from '@wallet-components';
import { ExchangeLayout } from '@exchange-components';

// Buy top-level component used in two contexts: `wallet` and standalone `exchange` app
export default () => {
    const { app, selectedAccount } = useExchange();

    // wrap by WalletLayout using wallet menu
    if (app === 'wallet') {
        // account loading or exception
        if (selectedAccount.status !== 'loaded') {
            return <WalletLayout title="Sell" account={selectedAccount} />;
        }

        const { account } = selectedAccount;

        return (
            <WalletLayout title="Sell" account={selectedAccount}>
                <H2>Sell in account context</H2>
                <P>Account descriptor: {account.descriptor}</P>
                <P>Balance: {account.balance}</P>
            </WalletLayout>
        );
    }

    // wrap by ExchangeLayout using exchange menu
    return (
        <ExchangeLayout title="Sell">
            <H2>Sell in standalone context</H2>
            <Select placeholder={<div>Select source account</div>} />
        </ExchangeLayout>
    );
};
