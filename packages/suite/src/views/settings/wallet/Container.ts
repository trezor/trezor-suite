import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import { AppState, Dispatch } from '@suite-types';
import Component from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    wallet: state.wallet,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    changeCoinVisibility: bindActionCreators(walletSettingsActions.changeCoinVisibility, dispatch),
    changeNetworks: bindActionCreators(walletSettingsActions.changeNetworks, dispatch),
});

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default connect(mapStateToProps, mapDispatchToProps)(Component);
