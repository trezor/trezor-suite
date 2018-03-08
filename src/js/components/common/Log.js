/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as LogActions from '../../actions/LogActions';

const Log = (props: any) => {

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
    (state) => {
        return {
            log: state.log
        };
    },
    (dispatch) => {
        return { 
            toggle: bindActionCreators(LogActions.toggle, dispatch),
        };
    }
)(Log);