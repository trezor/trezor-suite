/* @flow */
import React from 'react';
import { connect } from 'react-redux';

import type { State } from 'flowtype';
import EthereumTypeSendForm from './ethereum/Container';
import RippleTypeSendForm from './ripple/Container';
import BitcoinTypeSendForm from './bitcoin/Container';

export type BaseProps = {|
    selectedAccount: $ElementType<State, 'selectedAccount'>,
|};

// return container for requested network type
export default connect<BaseProps, any, _, _, _, _>(
    (state: State): BaseProps => ({
        selectedAccount: state.selectedAccount,
    }),
    null
)((props: BaseProps) => {
    const { network } = props.selectedAccount;
    if (!network) return null;

    switch (network.type) {
        case 'ethereum':
            return <EthereumTypeSendForm />;
        case 'ripple':
            return <RippleTypeSendForm />;
        case 'bitcoin':
            return <BitcoinTypeSendForm />;
        default:
            return null;
    }
});
