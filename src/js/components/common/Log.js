/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as SendFormActions from '../../actions/SendFormActions';
import { getAddress } from '../../actions/TrezorConnectActions';


const Log = (props: any) => {
    return (
        <details className="log">
            Log
        </details>
    )
}

function mapStateToProps(state, own) {
    
}

function mapDispatchToProps(dispatch) {
    
}

export default connect( 
    (state) => {
        return {
            accounts: state.accounts,
            receive: state.receive
        };
    },
    (dispatch) => {
        return { 
            getAddress: bindActionCreators(getAddress, dispatch),
        };
    }
)(Log);