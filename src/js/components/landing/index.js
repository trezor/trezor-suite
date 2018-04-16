/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import LandingPage from './LandingPage';

import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import type { State, Dispatch } from '../../flowtype';

export type Props = {
    localStorage: any,
    modal: any,
    web3: any,
    wallet: any,
    connect: any,
    router: any
}

type DispatchProps = {
    foo: () => string
}

type OwnProps = {
    
}

const mapStateToProps: MapStateToProps<State, OwnProps, Props> = (state: State): Props => {
    return {
        localStorage: state.localStorage,
        modal: state.modal,
        web3: state.web3,
        wallet: state.wallet,
        connect: state.connect,
        router: state.router
    };
}

const mapDispatchToProps: MapDispatchToProps<Dispatch, OwnProps, DispatchProps> = (dispatch: Dispatch) => {
    return { 
        foo: ():string => { return "A"; }
    };
}

export default connect(mapStateToProps, null)(LandingPage);