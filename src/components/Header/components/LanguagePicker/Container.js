/* @flow */
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import * as WalletActions from 'actions/WalletActions';
import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import type { State, Dispatch } from 'flowtype';

import LanguagePicker from './index';

type StateProps = {
    language: string,
}

type DispatchProps = {
    fetchLocale: typeof WalletActions.fetchLocale,
};

type OwnProps = {

}

export type Props = StateProps & DispatchProps;

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (state: State): StateProps => ({
    language: state.wallet.language,
});

const mapDispatchToProps: MapDispatchToProps<Dispatch, OwnProps, DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
    fetchLocale: bindActionCreators(WalletActions.fetchLocale, dispatch),
});

export default withRouter(
    connect(mapStateToProps, mapDispatchToProps)(LanguagePicker),
);
