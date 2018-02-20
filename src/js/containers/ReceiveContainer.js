/* @flow */
'use strict';

import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Receive from '../components/wallet/Receive';
import * as ReceiveActions from '../actions/ReceiveActions';
import { getAddress } from '../actions/TrezorConnectActions';

function mapStateToProps(state, own) {
    return {
        location: state.router.location,
        devices: state.connect.devices,
        accounts: state.accounts,
        discovery: state.discovery,
        receive: state.receive
    };
}

function mapDispatchToProps(dispatch) {
    return { 
        initAccount: bindActionCreators(ReceiveActions.init, dispatch), 
        updateAccount: bindActionCreators(ReceiveActions.update, dispatch),
        disposeAccount: bindActionCreators(ReceiveActions.dispose, dispatch),
        showAddress: bindActionCreators(ReceiveActions.showAddress, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(Receive);