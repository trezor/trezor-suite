/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as LogActions from '../../actions/LogActions';
import type { State, Dispatch } from '../../flowtype';

type Props = {
    log: $ElementType<State, 'log'>,
    toggle: typeof LogActions.toggle
}

const Log = (props: Props): ?React$Element<string> => {
    if (!props.log.opened)
        return null;
    
    return (
        <div className="log">
            <button className="log-close transparent" onClick={ props.toggle }></button>
            <h2>Log</h2>
            <p>Attention: The log contains your XPUBs. Anyone with your XPUBs can see your account history.</p>
            <textarea></textarea>
        </div>
    )
}

export default connect( 
    (state: State) => {
        return {
            log: state.log
        };
    },
    (dispatch: Dispatch) => {
        return { 
            toggle: bindActionCreators(LogActions.toggle, dispatch),
        };
    }
)(Log);