import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import * as suiteActions from '@suite-actions/suiteActions';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import * as routerActions from '@suite-actions/routerActions';
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
    setDiscreetMode: bindActionCreators(walletSettingsActions.setDiscreetMode, dispatch),
    createDeviceInstance: bindActionCreators(suiteActions.createDeviceInstance, dispatch),
    changePin: bindActionCreators(deviceSettingsActions.changePin, dispatch),
    goto: bindActionCreators(routerActions.goto, dispatch),
});

export type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> &
    WrappedComponentProps & {
        isDisabled: boolean;
    };

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(SecurityFeatures));
