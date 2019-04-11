/* @flow */
import React from 'react';
import { connect } from 'react-redux';

import type { State } from 'flowtype';
import EthereumTypeReceiveForm from './ethereum/Container';
import RippleTypeReceiveForm from './ripple/Container';

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
            return <EthereumTypeReceiveForm />;
        case 'ripple':
            return <RippleTypeReceiveForm />;
        default:
            return null;
    }
});
