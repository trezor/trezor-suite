/* @flow */
'use strict';

import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Bootloader from '../components/wallet/Bootloader';

function mapStateToProps(state, own) {
    return {
    
    };
}

function mapDispatchToProps(dispatch) {
    return { 
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(Bootloader);