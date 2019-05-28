/* @flow */
import React from 'react';
import { connect } from 'react-redux';

import type { State } from 'flowtype';

import EthereumTransactions from './ethereum';
import RippleTransactions from './ripple';
import BitcoinTransactions from './bitcoin';

export type BaseProps = {|
    selectedAccount: $ElementType<State, 'selectedAccount'>,
    localStorage: $ElementType<State, 'localStorage'>,
|};

export default connect<BaseProps, any, _, _, _, _>(
    (state: State): BaseProps => ({
        selectedAccount: state.selectedAccount,
        localStorage: state.localStorage,
    }),
    null
)((props: BaseProps) => {
    const { config } = props.localStorage;
    if (!config.transactions) return null; // turn off by feature tag
    const { network } = props.selectedAccount;
    if (!network || !config) return null;

    switch (network.type) {
        case 'ethereum':
            return <EthereumTransactions />;
        case 'ripple':
            return <RippleTransactions />;
        case 'bitcoin':
            return <BitcoinTransactions />;
        default:
            return null;
    }
});
