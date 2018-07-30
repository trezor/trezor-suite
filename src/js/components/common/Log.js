/* @flow */


import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as LogActions from '~/js/actions/LogActions';
import type { State, Dispatch } from '~/flowtype';

type Props = {
    log: $ElementType<State, 'log'>,
    toggle: typeof LogActions.toggle
}

const Log = (props: Props): ?React$Element<string> => {
    if (!props.log.opened) return null;

    // const entries = props.log.entries.map(entry => {
    //     return (

    //     )
    // })

    return (
        <div className="log">
            <button className="log-close transparent" onClick={props.toggle} />
            <h2>Log</h2>
            <p>Attention: The log contains your XPUBs. Anyone with your XPUBs can see your account history.</p>
            <textarea value={JSON.stringify(props.log.entries)} readOnly />
        </div>
    );
};

export default connect(
    (state: State) => ({
        log: state.log,
    }),
    (dispatch: Dispatch) => ({
        toggle: bindActionCreators(LogActions.toggle, dispatch),
    }),
)(Log);