import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import * as routerActions from '@suite-actions/routerActions';
import {
    applySettings,
    changePin,
    wipeDevice,
    openBackgroundGalleryModal,
} from '@settings-actions/deviceSettingsActions';
// todo: device management actions ?
import * as backupActions from '@settings-actions/backupActions';

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
    backupDevice: bindActionCreators(backupActions.backupDevice, dispatch),
    goto: bindActionCreators(routerActions.goto, dispatch),
    openBackgroundGalleryModal: bindActionCreators(openBackgroundGalleryModal, dispatch),
});

export type Props = WrappedComponentProps &
    ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps>;

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(DeviceSettings));
