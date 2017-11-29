/* @flow */
'use strict';

import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Loading from '../components/Send';

function mapStateToProps(state, own) {
    return {
        brain: state.brain
    };
}

function mapDispatchToProps(dispatch) {
    return { };
}

export default connect(mapStateToProps, mapDispatchToProps)(Loading);