/* @flow */
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as WalletActions from 'actions/WalletActions';
import type { State, Dispatch } from 'flowtype';

import LanguagePicker from './index';

type StateProps = {|
    language: string,
|};

type DispatchProps = {|
    fetchLocale: typeof WalletActions.fetchLocale,
|};

type OwnProps = {||};

export type Props = {| ...StateProps, ...DispatchProps, ...OwnProps |};

const mapStateToProps = (state: State): StateProps => ({
    language: state.wallet.language,
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
    fetchLocale: bindActionCreators(WalletActions.fetchLocale, dispatch),
});

export default connect<Props, OwnProps, StateProps, DispatchProps, State, Dispatch>(
    mapStateToProps,
    mapDispatchToProps
)(LanguagePicker);
