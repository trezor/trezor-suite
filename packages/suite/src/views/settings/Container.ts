import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import * as storageActions from '@suite-actions/storageActions';
import * as languageActions from '@settings-actions/languageActions';
import * as routerActions from '@suite-actions/routerActions';
import { AppState, Dispatch } from '@suite-types';
import Component from './index';

const mapStateToProps = (state: AppState) => ({
    locks: state.suite.locks,
    language: state.suite.settings.language,
    localCurrency: state.wallet.settings.localCurrency,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    setLocalCurrency: bindActionCreators(walletSettingsActions.setLocalCurrency, dispatch),
    clearStores: bindActionCreators(storageActions.clearStores, dispatch),
    fetchLocale: bindActionCreators(languageActions.fetchLocale, dispatch),
    goto: bindActionCreators(routerActions.goto, dispatch),
});

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default connect(mapStateToProps, mapDispatchToProps)(Component);
