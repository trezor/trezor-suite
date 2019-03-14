/* @flow */
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { injectIntl } from 'react-intl';

import * as WalletActions from 'actions/WalletActions';
import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import type { State, Dispatch } from 'flowtype';
import WalletSettings from './index';

type OwnProps = {};

type StateProps = {
    wallet: $ElementType<State, 'wallet'>,
    fiat: $ElementType<State, 'fiat'>,
    localStorage: $ElementType<State, 'localStorage'>,
};

type DispatchProps = {
    setLocalCurrency: typeof WalletActions.setLocalCurrency,
};

export type Props = StateProps & DispatchProps;

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (
    state: State
): StateProps => ({
    wallet: state.wallet,
    fiat: state.fiat,
    localStorage: state.localStorage,
});

const mapDispatchToProps: MapDispatchToProps<Dispatch, OwnProps, DispatchProps> = (
    dispatch: Dispatch
): DispatchProps => ({
    setLocalCurrency: bindActionCreators(WalletActions.setLocalCurrency, dispatch),
});

export default injectIntl(
    connect(
        mapStateToProps,
        mapDispatchToProps
    )(WalletSettings)
);
