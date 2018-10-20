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
    signature: string,
    isSignProgress: boolean
}

export type DispatchProps = {
    signVerifyActions: typeof SignVerifyActions,
}

export type Props = StateProps & DispatchProps;

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (state: State): StateProps => ({
    selectedAccount: state.selectedAccount,
    signature: state.signVerifyReducer.signature,
    isSignProgress: state.signVerifyReducer.isSignProgress,
});

const mapDispatchToProps: MapDispatchToProps<Dispatch, OwnProps, DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
    signVerifyActions: bindActionCreators(SignVerifyActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Component);