/* @flow */
import React from 'react';
import { connect } from 'react-redux';

import type { State } from 'flowtype';
import EthereumSummary from './ethereum/Container';
import RippleSummary from './ripple/Container';

type WrapperProps = {
    selectedAccount: $ElementType<State, 'selectedAccount'>,
}

// return container for requested network type
export default connect((state: State): WrapperProps => ({
    selectedAccount: state.selectedAccount,
}), null)((props) => {
    const { network } = props.selectedAccount;
    if (!network) return null;

    switch (network.type) {
        case 'ethereum':
            return <EthereumSummary />;
        case 'ripple':
            return <RippleSummary />;
        default:
            return null;
    }
});
