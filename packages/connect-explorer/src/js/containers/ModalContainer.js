/* @flow */
'use strict';

import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Modal from '../components/modal/Modal';
import * as ModalActions from '../actions/ModalActions';

function mapStateToProps(state, own) {
    return {
        modal: state.modal
    };
}

function mapDispatchToProps(dispatch) {
    return {
        modalActions: bindActionCreators(ModalActions, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(Modal);