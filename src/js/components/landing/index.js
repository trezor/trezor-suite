/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import LandingPage from './LandingPage';

import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import type { State, Dispatch } from '~/flowtype';

export type StateProps = {
    localStorage: $ElementType<State, 'localStorage'>,
    modal: $ElementType<State, 'modal'>,
    web3: $ElementType<State, 'web3'>,
    wallet: $ElementType<State, 'wallet'>,
    connect: $ElementType<State, 'connect'>,
    router: $ElementType<State, 'router'>
}

type DispatchProps = {

}

type OwnProps = {
    
}

export type Props = StateProps & DispatchProps;

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (state: State): StateProps => {
    return {
        localStorage: state.localStorage,
        modal: state.modal,
        web3: state.web3,
        wallet: state.wallet,
        connect: state.connect,
        router: state.router
    };
}

const mapDispatchToProps: MapDispatchToProps<Dispatch, OwnProps, DispatchProps> = (dispatch: Dispatch): DispatchProps => {
    return { 
        
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(LandingPage);