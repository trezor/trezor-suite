import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as routerActions from '@suite-actions/routerActions';
import * as modalActions from '@suite-actions/modalActions';
import { applySettings, changePin } from '@settings-actions/deviceSettingsActions';

import { AppState, Dispatch } from '@suite-types';

import DeviceSettings from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            applySettings,
            changePin,
            goto: routerActions.goto,
            openModal: modalActions.openModal,
        },
        dispatch,
    );

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default connect(mapStateToProps, mapDispatchToProps)(DeviceSettings);
