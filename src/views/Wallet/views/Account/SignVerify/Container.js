/* @flow */

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as SignVerifyActions from 'actions/SignVerifyActions';
import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import type { State, Dispatch } from 'flowtype';
import Component from './index';

type OwnProps = {}

export type StateProps = {
    wallet: $ElementType<State, 'wallet'>,
    selectedAccount: $ElementType<State, 'selectedAccount'>,
    signature: string,
    isSignProgress: boolean,
    isVerifyProgress: boolean
}

export type DispatchProps = {
    signVerifyActions: typeof SignVerifyActions,
}

export type Props = StateProps & DispatchProps;

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (state: State): StateProps => ({
    wallet: state.wallet,
    selectedAccount: state.selectedAccount,
    signature: state.signVerifyReducer.signature,
    isSignProgress: state.signVerifyReducer.isSignProgress,
    isVerifyProgress: state.signVerifyReducer.isVerifyProgress,
});

const mapDispatchToProps: MapDispatchToProps<Dispatch, OwnProps, DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
    signVerifyActions: bindActionCreators(SignVerifyActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Component);