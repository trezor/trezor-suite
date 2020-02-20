import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as routerActions from '@suite-actions/routerActions';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';

import { AppState, Dispatch } from '@suite-types';
import Menu from './index';

const mapStateToProps = (state: AppState) => ({
    router: state.router,
    selectedDevice: state.suite.device,
    devices: state.devices,
    discreetMode: state.wallet.settings.discreetMode,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
    setDiscreetMode: bindActionCreators(walletSettingsActions.setDiscreetMode, dispatch),
});

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type Props = StateProps & DispatchProps;

export default connect(mapStateToProps, mapDispatchToProps)(Menu);
