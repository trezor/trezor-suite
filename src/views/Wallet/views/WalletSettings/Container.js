/* @flow */
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { injectIntl } from 'react-intl';
import type { IntlShape } from 'react-intl';

import * as WalletActions from 'actions/WalletActions';
import * as LocalStorageActions from 'actions/LocalStorageActions';
import type { State, Dispatch } from 'flowtype';
import WalletSettings from './index';

type OwnProps = {|
    intl: IntlShape,
|};

type StateProps = {|
    wallet: $ElementType<State, 'wallet'>,
    fiat: $ElementType<State, 'fiat'>,
    localStorage: $ElementType<State, 'localStorage'>,
|};

type DispatchProps = {|
    setLocalCurrency: typeof WalletActions.setLocalCurrency,
    setHideBalance: typeof WalletActions.setHideBalance,
    handleCoinVisibility: typeof LocalStorageActions.handleCoinVisibility,
    handleAllCoinsVisibility: typeof LocalStorageActions.handleAllCoinsVisibility,
|};

export type Props = {| ...OwnProps, ...StateProps, ...DispatchProps |};

const mapStateToProps = (state: State): StateProps => ({
    wallet: state.wallet,
    fiat: state.fiat,
    localStorage: state.localStorage,
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
    setLocalCurrency: bindActionCreators(WalletActions.setLocalCurrency, dispatch),
    setHideBalance: bindActionCreators(WalletActions.setHideBalance, dispatch),
    handleCoinVisibility: bindActionCreators(LocalStorageActions.handleCoinVisibility, dispatch),
    handleAllCoinsVisibility: bindActionCreators(
        LocalStorageActions.handleAllCoinsVisibility,
        dispatch
    ),
});

export default injectIntl<OwnProps>(
    connect<Props, OwnProps, StateProps, DispatchProps, State, Dispatch>(
        mapStateToProps,
        mapDispatchToProps
    )(WalletSettings)
);
