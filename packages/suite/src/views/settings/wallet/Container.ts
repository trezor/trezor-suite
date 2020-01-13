import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { injectIntl } from 'react-intl';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import { AppState, Dispatch } from '@suite-types';
import WalletSettings from './index';

const mapStateToProps = (state: AppState) => ({
    wallet: state.wallet,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    setDiscreetMode: bindActionCreators(walletSettingsActions.setDiscreetMode, dispatch),
    changeCoinVisibility: bindActionCreators(walletSettingsActions.changeCoinVisibility, dispatch),
});

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(WalletSettings));
