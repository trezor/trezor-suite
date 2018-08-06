/* @flow */


import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { default as ReceiveActions } from '~/js/actions/ReceiveActions';
import * as TokenActions from '~/js/actions/TokenActions';
import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import Receive from './Receive';

import type { State, Dispatch } from '~/flowtype';
import type {
    StateProps as BaseStateProps,
    DispatchProps as BaseDispatchProps,
} from '../SelectedAccount';

type OwnProps = { }

type StateProps = BaseStateProps & {
    receive: $ElementType<State, 'receive'>,
    modal: $ElementType<State, 'modal'>,
}

type DispatchProps = BaseDispatchProps & {
    showAddress: typeof ReceiveActions.showAddress
};

export type Props = StateProps & BaseStateProps & DispatchProps & BaseDispatchProps;

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (state: State, own: OwnProps): StateProps => ({
    className: 'receive',
    selectedAccount: state.selectedAccount,
    wallet: state.wallet,

    receive: state.receive,
    modal: state.modal,
});

const mapDispatchToProps: MapDispatchToProps<Dispatch, OwnProps, DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
    showAddress: bindActionCreators(ReceiveActions.showAddress, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Receive);