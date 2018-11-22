/* @flow */

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import SignVerifyActions from 'actions/SignVerifyActions';
import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import type { State, Dispatch } from 'flowtype';
import Component from './index';

type OwnProps = {}

export type SignVerifyState = {
    signSignature: string,
    signAddress: string,
    signMessage: string,
    signSignature: string,
    verifyAddress: string,
    verifyMessage: string,
    verifySignature: string,
    touched: Array<string>,
}

export type StateProps = {
    wallet: $ElementType<State, 'wallet'>,
    selectedAccount: $ElementType<State, 'selectedAccount'>,
    signVerify: SignVerifyState,
}

export type DispatchProps = {
    signVerifyActions: typeof SignVerifyActions,
}

export type Props = StateProps & DispatchProps;

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (state: State): StateProps => ({
    wallet: state.wallet,
    selectedAccount: state.selectedAccount,
    signVerify: state.signVerifyReducer,
});

const mapDispatchToProps: MapDispatchToProps<Dispatch, OwnProps, DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
    signVerifyActions: bindActionCreators(SignVerifyActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Component);