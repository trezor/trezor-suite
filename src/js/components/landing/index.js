/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import LandingPage from './LandingPage';

const mapStateToProps = (state, own) => {
    return {
        localStorage: state.localStorage,
        modal: state.modal,
        web3: state.web3,
        wallet: state.wallet,
        connect: state.connect,
        router: state.router
    };
}

const mapDispatchToProps = (dispatch) => {
    return { 
   
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(LandingPage);