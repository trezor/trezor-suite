/* @flow */
'use strict';

import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Settings from '../components/wallet/Settings';

function mapStateToProps(state, own) {
    return {
    };
}

function mapDispatchToProps(dispatch) {
    return { 
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(Settings);