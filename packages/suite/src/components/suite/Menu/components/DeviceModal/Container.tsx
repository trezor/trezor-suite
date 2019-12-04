import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as routerActions from '@suite-actions/routerActions';
import * as suiteActions from '@suite-actions/suiteActions';
import * as modalActions from '@suite-actions/modalActions';

import { AppState, Dispatch } from '@suite-types';
import Component from './index';
import { injectIntl, WrappedComponentProps } from 'react-intl';

const mapStateToProps = (state: AppState) => ({
    router: state.router,
    selectedDevice: state.suite.device,
    devices: state.devices,
    accounts: state.wallet.accounts,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
    forgetDevice: bindActionCreators(modalActions.onForgetDevice, dispatch),
    forgetDeviceInstance: bindActionCreators(modalActions.onForgetDeviceInstance, dispatch),
    selectDevice: bindActionCreators(suiteActions.selectDevice, dispatch),
    requestDeviceInstance: bindActionCreators(suiteActions.requestDeviceInstance, dispatch),
});

interface OwnProps extends WrappedComponentProps {
    isOpen: boolean;
    closeModal: () => void;
}

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type Props = StateProps & DispatchProps & OwnProps;

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(Component));
