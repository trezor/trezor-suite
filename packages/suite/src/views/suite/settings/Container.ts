import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { injectIntl } from 'react-intl';

import { applySettings, changePin } from '@suite-actions/trezorConnectActions';
import { AppState, Dispatch } from '@suite-types/index';

import DeviceSettings from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    applySettings: bindActionCreators(applySettings, dispatch),
    changePin: bindActionCreators(changePin, dispatch),
});

export default injectIntl(
    connect(
        mapStateToProps,
        mapDispatchToProps,
    )(DeviceSettings),
);
