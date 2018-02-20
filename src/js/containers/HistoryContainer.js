/* @flow */
'use strict';

import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import History from '../components/wallet/History';
import * as SendFormActions from '../actions/SendFormActions';

function mapStateToProps(state, own) {
    return {
        web3: state.web3.web3,
    };
}

function mapDispatchToProps(dispatch) {
    return { 
        //sendFormActions: bindActionCreators(SendFormActions, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(History);