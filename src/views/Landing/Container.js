/* @flow */
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as RouterActions from 'actions/RouterActions';

import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import type { State, Dispatch } from 'flowtype';
import LandingPage from './index';


export type StateProps = {
    localStorage: $ElementType<State, 'localStorage'>,
    modal: $ElementType<State, 'modal'>,
    wallet: $ElementType<State, 'wallet'>,
    connect: $ElementType<State, 'connect'>,
    router: $ElementType<State, 'router'>,
    wallet: $ElementType<State, 'wallet'>,
    devices: $ElementType<State, 'devices'>,
}

type DispatchProps = {

}

type OwnProps = {

}

export type Props = StateProps & DispatchProps;

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (state: State): StateProps => ({
    localStorage: state.localStorage,
    modal: state.modal,
    wallet: state.wallet,
    connect: state.connect,
    router: state.router,
    devices: state.devices,
});

const mapDispatchToProps: MapDispatchToProps<Dispatch, OwnProps, DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
    selectFirstAvailableDevice: bindActionCreators(RouterActions.selectFirstAvailableDevice, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(LandingPage);