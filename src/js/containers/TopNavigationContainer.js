/* @flow */
'use strict';

import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import TopNavigation from '../components/TopNavigation';
import * as TrezorConnectActions from '../actions/TrezorConnectActions';
import { resizeAppContainer, toggleDeviceDropdown } from '../actions/AppActions';

function mapStateToProps(state, own) {
    return {
        connect: state.connect
    };
}

function mapDispatchToProps(dispatch) {
    return {
        toggleDeviceDropdown: bindActionCreators(toggleDeviceDropdown, dispatch),
        resizeAppContainer: bindActionCreators(resizeAppContainer, dispatch),
        acquireDevice: bindActionCreators(TrezorConnectActions.acquire, dispatch),
        onSelectDevice: bindActionCreators(TrezorConnectActions.onSelectDevice, dispatch),
    };
}

// export default connect(mapStateToProps, mapDispatchToProps)(TopNavigation);
export default withRouter(
    connect(mapStateToProps, mapDispatchToProps)(TopNavigation)
);