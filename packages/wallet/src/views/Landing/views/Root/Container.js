/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';

import type { State } from 'flowtype';
import RootView from './index';

type OwnProps = {|
    children?: React.Node,
|};
export type StateProps = {|
    localStorage: $ElementType<State, 'localStorage'>,
    modal: $ElementType<State, 'modal'>,
    wallet: $ElementType<State, 'wallet'>,
    connect: $ElementType<State, 'connect'>,
    router: $ElementType<State, 'router'>,
    wallet: $ElementType<State, 'wallet'>,
    devices: $ElementType<State, 'devices'>,
    children?: React.Node,
|};

type DispatchProps = {||};

export type Props = {| ...OwnProps, ...StateProps, ...DispatchProps |};

const mapStateToProps = (state: State): StateProps => ({
    localStorage: state.localStorage,
    modal: state.modal,
    wallet: state.wallet,
    connect: state.connect,
    router: state.router,
    devices: state.devices,
});

export default connect<Props, OwnProps, StateProps, DispatchProps, State, _>(mapStateToProps)(
    RootView
);
