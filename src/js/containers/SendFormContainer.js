/* @flow */
'use strict';

import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import SendForm from '../components/SendForm';
import * as SendFormActions from '../actions/SendFormActions';

function mapStateToProps(state, own) {
    return {
        addresses: state.addresses,
        sendForm: state.sendForm
    };
}

function mapDispatchToProps(dispatch) {
    return { 
        sendFormActions: bindActionCreators(SendFormActions, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(SendForm);