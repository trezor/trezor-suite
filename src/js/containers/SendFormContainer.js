/* @flow */
'use strict';

import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import SendForm from '../components/wallet/send/SendForm';
import * as SendFormActions from '../actions/SendFormActions';

function mapStateToProps(state, own) {
    return {
        location: state.router.location,
        devices: state.connect.devices,
        accounts: state.accounts,
        discovery: state.discovery,
        tokens: state.tokens,
        sendForm: state.sendForm,
        fiatRate: state.web3.fiatRate
    };
}

function mapDispatchToProps(dispatch) {
    return { 
        sendFormActions: bindActionCreators(SendFormActions, dispatch),
        initAccount: bindActionCreators(SendFormActions.init, dispatch), 
        updateAccount: bindActionCreators(SendFormActions.update, dispatch), 
        disposeAccount: bindActionCreators(SendFormActions.dispose, dispatch),  
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(SendForm);