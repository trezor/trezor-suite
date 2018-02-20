/* @flow */
'use strict';

import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Acquire from '../components/wallet/Acquire';
import * as TrezorConnectActions from '../actions/TrezorConnectActions';

function mapStateToProps(state, own) {
    return {
        connect: state.connect
    };
}

function mapDispatchToProps(dispatch) {
    return {
        acquireDevice: bindActionCreators(TrezorConnectActions.acquire, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(Acquire);