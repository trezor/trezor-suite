/* @flow */


import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { default as SendFormActions } from '~/js/actions/SendFormActions';
import * as SessionStorageActions from '~/js/actions/SessionStorageActions';
import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import SendForm from './SendForm';

import type { State, Dispatch } from '~/flowtype';
import type { StateProps as BaseStateProps, DispatchProps as BaseDispatchProps } from '../SelectedAccount';

type OwnProps = { }

export type StateProps = BaseStateProps & {
    sendForm: $ElementType<State, 'sendForm'>,
    fiat: $ElementType<State, 'fiat'>,
    localStorage: $ElementType<State, 'localStorage'>,
    children?: React.Node;
}

export type DispatchProps = BaseDispatchProps & {
    sendFormActions: typeof SendFormActions,
    saveSessionStorage: typeof SessionStorageActions.save
}

export type Props = StateProps & BaseStateProps & DispatchProps & BaseDispatchProps;

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (state: State, own: OwnProps): StateProps => ({
    className: 'send-from',
    selectedAccount: state.selectedAccount,
    wallet: state.wallet,

    sendForm: state.sendForm,
    fiat: state.fiat,
    localStorage: state.localStorage,
});

const mapDispatchToProps: MapDispatchToProps<Dispatch, OwnProps, DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
    sendFormActions: bindActionCreators(SendFormActions, dispatch),
    saveSessionStorage: bindActionCreators(SessionStorageActions.save, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(SendForm);