/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as RouterActions from 'actions/RouterActions';

import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import type { State, Dispatch } from 'flowtype';
import ImportView from './index';

export type StateProps = {
    transport: $ElementType<$ElementType<State, 'connect'>, 'transport'>,
    children?: React.Node,
}

type DispatchProps = {
    selectFirstAvailableDevice: typeof RouterActions.selectFirstAvailableDevice,
}

type OwnProps = {

}

export type Props = StateProps & DispatchProps;

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (state: State): StateProps => ({
    transport: state.connect.transport,
});

const mapDispatchToProps: MapDispatchToProps<Dispatch, OwnProps, DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
    selectFirstAvailableDevice: bindActionCreators(RouterActions.selectFirstAvailableDevice, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(ImportView);