/* @flow */
import React from 'react';
import { connect } from 'react-redux';

import type { State } from 'flowtype';
import EthereumTypeSendForm from './ethereum/Container';
import RippleTypeSendForm from './ripple/Container';

export type BaseProps = {
    selectedAccount: $ElementType<State, 'selectedAccount'>,
}

// return container for requested network type
export default connect((state: State): BaseProps => ({
    selectedAccount: state.selectedAccount,
}), null)((props) => {
    const { network } = props.selectedAccount;
    if (!network) return null;

    switch (network.type) {
        case 'ethereum':
            return <EthereumTypeSendForm />;
        case 'ripple':
            return <RippleTypeSendForm />;
        default:
            return null;
    }
});
