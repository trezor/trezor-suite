/* @flow */
'use strict';

import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import LandingPage from '../components/landing/LandingPage';
import * as LogActions from '../actions/LogActions';

function mapStateToProps(state, own) {
    return {
        localStorage: state.localStorage,
        modal: state.modal,
        web3: state.web3,
        connect: state.connect,
        router: state.router
    };
}

function mapDispatchToProps(dispatch) {
    return { 
   
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(LandingPage);