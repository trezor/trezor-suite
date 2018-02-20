/* @flow */
'use strict';

import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import SignVerify from '../components/wallet/SignVerify';

function mapStateToProps(state, own) {
    return {
    };
}

function mapDispatchToProps(dispatch) {
    return { 
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(SignVerify);