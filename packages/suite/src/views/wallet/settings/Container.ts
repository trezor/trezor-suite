import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { injectIntl } from 'react-intl';

import * as settingsActions from '@wallet-actions/settingsActions';
// import * as LocalStorageActions from 'actions/LocalStorageActions';
import { AppState, Dispatch } from '@suite-types';
import WalletSettings from './index';

const mapStateToProps = (state: AppState) => ({
    wallet: state.wallet,
    // fiat: state.fiat,
    // localStorage: state.localStorage,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    setLocalCurrency: bindActionCreators(settingsActions.setLocalCurrency, dispatch),
    setHideBalance: bindActionCreators(settingsActions.setHideBalance, dispatch),
    handleCoinVisibility: bindActionCreators(settingsActions.handleCoinVisibility, dispatch),
    toggleGroupCoinsVisibility: bindActionCreators(
        settingsActions.toggleGroupCoinsVisibility,
        dispatch,
    ),
});

export default injectIntl(
    connect(
        mapStateToProps,
        mapDispatchToProps,
    )(WalletSettings),
);
