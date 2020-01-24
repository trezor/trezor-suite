import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as routerActions from '@suite-actions/routerActions';
import * as suiteActions from '@suite-actions/suiteActions';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';

import { AppState, Dispatch, InjectedModalApplicationProps } from '@suite-types';
import Component from './index';

const mapStateToProps = (state: AppState) => ({
    router: state.router,
    selectedDevice: state.suite.device,
    devices: state.devices,
    accounts: state.wallet.accounts,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
    rememberDevice: bindActionCreators(suiteActions.rememberDevice, dispatch),
    forgetDevice: bindActionCreators(suiteActions.forgetDevice, dispatch),
    createDeviceInstance: bindActionCreators(suiteActions.createDeviceInstance, dispatch),
    selectDevice: bindActionCreators(suiteActions.selectDevice, dispatch),
    applySettings: bindActionCreators(deviceSettingsActions.applySettings, dispatch),
});

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type Props = StateProps & DispatchProps & InjectedModalApplicationProps;

export default connect(mapStateToProps, mapDispatchToProps)(Component);
