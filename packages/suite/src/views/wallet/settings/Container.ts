/* @flow */
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { injectIntl } from 'react-intl';

import * as settingsActions from '@wallet-actions/settingsActions';
// import * as LocalStorageActions from 'actions/LocalStorageActions';
import { State, Dispatch } from '@suite-types/index';
import WalletSettings from './index';

const mapStateToProps = (state: State) => ({
    wallet: state.wallet,
    // fiat: state.fiat,
    // localStorage: state.localStorage,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    setLocalCurrency: bindActionCreators(settingsActions.setLocalCurrency, dispatch),
    setHideBalance: bindActionCreators(settingsActions.setHideBalance, dispatch),
    // handleCoinVisibility: bindActionCreators(LocalStorageActions.handleCoinVisibility, dispatch),
    // toggleGroupCoinsVisibility: bindActionCreators(
    //     LocalStorageActions.toggleGroupCoinsVisibility,
    //     dispatch
    // ),
});

export default injectIntl(
    connect(
        mapStateToProps,
        mapDispatchToProps,
    )(WalletSettings),
);
