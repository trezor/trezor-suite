/* @flow */
'use strict';

import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as ComposeTxActions from '../actions/methods/ComposeTxActions';
import * as GetXpubActions from '../actions/methods/GetXpubActions';
import * as NEMSignTxActions from '../actions/methods/NEMSignTxActions';

function mapStateToProps(state, own) {
    return {
        connect: state.connect,
        composeTx: state.composeTx,
        getXpub: state.getXpub,
        nemSignTx: state.nemSignTx,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        composeTxActions: bindActionCreators(ComposeTxActions, dispatch),
        getXpubActions: bindActionCreators(GetXpubActions, dispatch),
        nemSignTxActions: bindActionCreators(NEMSignTxActions, dispatch),
    };
}

const Method = (props): any => {
    return props.component(props);
}

export default connect(mapStateToProps, mapDispatchToProps)(Method);