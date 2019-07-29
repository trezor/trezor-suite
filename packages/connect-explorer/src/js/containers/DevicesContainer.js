/* @flow */
'use strict';

import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Devices from '../components/Devices';
import * as TrezorConnectActions from '../actions/TrezorConnectActions';

function mapStateToProps(state, own) {
    return {
        connect: state.connect
    };
}

function mapDispatchToProps(dispatch) {
    return { 
        onSelectDevice: bindActionCreators(TrezorConnectActions.onSelectDevice, dispatch)
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(Devices);