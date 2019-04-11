/* @flow */
import React from 'react';
import { connect } from 'react-redux';

import type { State } from 'flowtype';
import EthereumTypeSummary from './ethereum/Container';
import RippleTypeSummary from './ripple/Container';

type WrapperProps = {|
    selectedAccount: $ElementType<State, 'selectedAccount'>,
|};

// return container for requested network type
export default connect<WrapperProps, any, _, _, _, _>(
    (state: State): WrapperProps => ({
        selectedAccount: state.selectedAccount,
    })
)((props: WrapperProps) => {
    const { network } = props.selectedAccount;
    if (!network) return null;

    switch (network.type) {
        case 'ethereum':
            return <EthereumTypeSummary />;
        case 'ripple':
            return <RippleTypeSummary />;
        default:
            return null;
    }
});
