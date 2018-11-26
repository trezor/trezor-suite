/* @flow */
import React from 'react';
import { connect } from 'react-redux';

import type { State } from 'flowtype';
import EthereumSummary from './containers/EthereumSummary/Container';

type StateProps = {
    selectedAccount: $ElementType<State, 'selectedAccount'>,
    summary: $ElementType<State, 'summary'>,
    wallet: $ElementType<State, 'wallet'>,
    tokens: $ElementType<State, 'tokens'>,
    fiat: $ElementType<State, 'fiat'>,
    localStorage: $ElementType<State, 'localStorage'>,
};

export type Props = StateProps;

type WrapperProps = {
    selectedAccount: $ElementType<State, 'selectedAccount'>,
}

// wrapper will return container for requested network type
export default connect((state: State): WrapperProps => ({
    selectedAccount: state.selectedAccount,
}), null)((props) => {
    const { network } = props.selectedAccount;
    if (!network) return null;

    if (network.type === 'ripple') {
        return <EthereumSummary />;
    }
    return <EthereumSummary />;
});
