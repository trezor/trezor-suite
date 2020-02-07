import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import * as routerActions from '@suite-actions/routerActions';
import * as modalActions from '@suite-actions/modalActions';
import { applySettings, changePin, wipeDevice } from '@settings-actions/deviceSettingsActions';

import { AppState, Dispatch } from '@suite-types';

import DeviceSettings from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    locks: state.suite.locks,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    applySettings: bindActionCreators(applySettings, dispatch),
    changePin: bindActionCreators(changePin, dispatch),
    wipeDevice: bindActionCreators(wipeDevice, dispatch),
    goto: bindActionCreators(routerActions.goto, dispatch),
    openModal: bindActionCreators(modalActions.openModal, dispatch),
});

export type Props = WrappedComponentProps &
    ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps>;

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(DeviceSettings));
