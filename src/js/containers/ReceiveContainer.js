/* @flow */
'use strict';

import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Receive from '../components/Receive';
import * as SendFormActions from '../actions/SendFormActions';

function mapStateToProps(state, own) {
    return {
        addresses: state.addresses
    };
}

function mapDispatchToProps(dispatch) {
    return { 
        sendFormActions: bindActionCreators(SendFormActions, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(Receive);