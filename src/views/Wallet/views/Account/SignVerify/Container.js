/* @flow */

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as SignVerifyActions from 'actions/SignVerifyActions';
import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import type { State, Dispatch } from 'flowtype';
import Component from './index';

type OwnProps = {}

export type StateProps = {
    selectedAccount: $ElementType<State, 'selectedAccount'>,
    sendForm: $ElementType<State, 'sendForm'>,
    wallet: $ElementType<State, 'wallet'>,
    fiat: $ElementType<State, 'fiat'>,
    localStorage: $ElementType<State, 'localStorage'>,
}

export type Props = StateProps & DispatchProps;

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (state: State): StateProps => ({
    selectedAccount: state.selectedAccount,
    sendForm: state.sendForm,
    wallet: state.wallet,
    fiat: state.fiat,
    localStorage: state.localStorage,
});

const mapDispatchToProps: MapDispatchToProps<Dispatch, OwnProps, DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
    signVerifyActions: bindActionCreators(SignVerifyActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Component);