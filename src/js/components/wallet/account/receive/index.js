/* @flow */
'use strict';

import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { default as ReceiveActions } from '~/js/actions/ReceiveActions';
import { default as AbstractAccountActions } from '~/js/actions/AbstractAccountActions';
import * as TokenActions from '~/js/actions/TokenActions';
import Receive from './Receive';

import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import type { State, Dispatch } from '~/flowtype';
import type { 
    StateProps as BaseStateProps,
    DispatchProps as BaseDispatchProps 
} from '../AbstractAccount';

import type { AccountState } from '../AbstractAccount';

type OwnProps = { }

type StateProps = BaseStateProps & {
    receive: $ElementType<State, 'receive'>,
}

type DispatchProps = BaseDispatchProps & {
    showAddress: typeof ReceiveActions.showAddress
};

export type Props = StateProps & DispatchProps;

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (state: State, own: OwnProps): StateProps => {
    return {
        abstractAccount: state.abstractAccount,
        devices: state.connect.devices,
        accounts: state.accounts,
        discovery: state.discovery,
        receive: state.receive
    };
}

const mapDispatchToProps: MapDispatchToProps<Dispatch, OwnProps, DispatchProps> = (dispatch: Dispatch): DispatchProps => {
    return {
        abstractAccountActions: bindActionCreators(AbstractAccountActions, dispatch),

        initAccount: bindActionCreators(ReceiveActions.init, dispatch), 
        disposeAccount: bindActionCreators(ReceiveActions.dispose, dispatch),
        showAddress: bindActionCreators(ReceiveActions.showAddress, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(Receive);