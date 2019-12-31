import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import * as settingsActions from '@wallet-actions/settingsActions';
import * as modalActions from '@suite-actions/modalActions';
import * as deviceSettingsActions from '@suite-actions/deviceSettingsActions';
import * as backupActions from '@suite-actions/backupActions';
import { Dispatch, AppState } from '@suite-types';
import SecurityFeatures from './index';

const mapStateToProps = (state: AppState) => ({
    discovery: state.wallet.discovery,
    accounts: state.wallet.accounts,
    fiat: state.wallet.fiat,
    device: state.suite.device,
    discreetMode: state.wallet.settings.discreetMode,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    setDiscreetMode: bindActionCreators(settingsActions.setDiscreetMode, dispatch),
    onCreateDeviceInstance: bindActionCreators(modalActions.onCreateDeviceInstance, dispatch),
    changePin: bindActionCreators(deviceSettingsActions.changePin, dispatch),
    backupDevice: bindActionCreators(backupActions.backupDevice, dispatch),
});

export type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> &
    WrappedComponentProps;

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(SecurityFeatures));
