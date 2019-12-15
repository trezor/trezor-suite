import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { injectIntl } from 'react-intl';
import * as settingsActions from '@wallet-actions/settingsActions';
import { AppState, Dispatch } from '@suite-types';
import WalletSettings from './index';

const mapStateToProps = (state: AppState) => ({
    wallet: state.wallet,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    setHideBalance: bindActionCreators(settingsActions.setHideBalance, dispatch),
    changeCoinVisibility: bindActionCreators(settingsActions.changeCoinVisibility, dispatch),
});

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(WalletSettings));
