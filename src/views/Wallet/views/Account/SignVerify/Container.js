/* @flow */

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';

import SignVerifyActions from 'actions/SignVerifyActions';
import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import type { State, Dispatch } from 'flowtype';
import Component from './index';

type OwnProps = {
    intl: any,
}

export type Error = {
    inputName: string,
    message: ?string,
};

export type StateProps = {
    wallet: $ElementType<State, 'wallet'>,
    selectedAccount: $ElementType<State, 'selectedAccount'>,
    signVerify: $ElementType<State, 'signVerify'>,
}

export type DispatchProps = {
    signVerifyActions: typeof SignVerifyActions,
}

export type Props = OwnProps & StateProps & DispatchProps;

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (state: State): StateProps => ({
    wallet: state.wallet,
    selectedAccount: state.selectedAccount,
    signVerify: state.signVerify,
});

const mapDispatchToProps: MapDispatchToProps<Dispatch, OwnProps, DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
    signVerifyActions: bindActionCreators(SignVerifyActions, dispatch),
});

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(Component));