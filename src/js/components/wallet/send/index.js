/* @flow */
'use strict';

import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as SendFormActions from '../../../actions/SendFormActions';
import * as AbstractAccountActions from '../../../actions/AbstractAccountActions';
import SendForm from './SendForm';

const mapStateToProps = (state, own) => {
    return {
        abstractAccount: state.abstractAccount,
        location: state.router.location,
        devices: state.connect.devices,
        accounts: state.accounts,
        discovery: state.discovery,
        tokens: state.tokens,
        pending: state.pending,
        sendForm: state.sendForm,
        fiat: state.fiat,
        localStorage: state.localStorage
    };
}

const mapDispatchToProps = (dispatch) => {
    return {
        abstractAccountActions: bindActionCreators(AbstractAccountActions, dispatch),
        sendFormActions: bindActionCreators(SendFormActions, dispatch),
        initAccount: bindActionCreators(SendFormActions.init, dispatch), 
        updateAccount: bindActionCreators(SendFormActions.update, dispatch), 
        disposeAccount: bindActionCreators(SendFormActions.dispose, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(SendForm)