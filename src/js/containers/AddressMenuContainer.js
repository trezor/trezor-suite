/* @flow */
'use strict';

import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import AddressMenu from '../components/AddressMenu';
//import * as AccountActions from '../actions/AccountActions';

function mapStateToProps(state, own) {
    return {
        web3: state.web3.web3,
        addresses: state.addresses
    };
}

function mapDispatchToProps(dispatch) {
    return {
        //onAccountSelect: bindActionCreators(AccountActions.onAccountSelect, dispatch)
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(AddressMenu);