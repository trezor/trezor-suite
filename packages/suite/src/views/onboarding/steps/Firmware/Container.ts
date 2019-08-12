import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as onboardingActions from '@suite/actions/onboarding/onboardingActions';
import * as firmwareUpdateActions from '@suite/actions/onboarding/firmwareUpdateActions';
import * as connectActions from '@suite/actions/onboarding/connectActions';
import { Dispatch, AppState } from '@suite-types';
import Step from './index';

const mapStateToProps = (state: AppState) => ({
    deviceCall: state.onboarding.connect.deviceCall,
    device: state.onboarding.connect.device,
    firmwareUpdate: state.onboarding.firmwareUpdate,
    // path: state.onboarding.path,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    // connectActions: {
    //     callActionAndGoToNextStep: bindActionCreators(
    //         connectActions.callActionAndGoToNextStep,
    //         dispatch,
    //     ),
    //     resetDevice: bindActionCreators(connectActions.resetDevice, dispatch),
    // },
    onboardingActions: {
        goToNextStep: bindActionCreators(onboardingActions.goToNextStep, dispatch),
    },
    firmwareUpdateActions: {
        updateFirmware: bindActionCreators(firmwareUpdateActions.updateFirmware, dispatch),
    },
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Step);
