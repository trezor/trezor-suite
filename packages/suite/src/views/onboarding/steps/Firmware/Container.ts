import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as onboardingActions from '@suite/actions/onboarding/onboardingActions';
import * as firmwareUpdateActions from '@suite/actions/onboarding/firmwareUpdateActions';
import { Dispatch, AppState } from '@suite-types/index';

import Step from './index';

const mapStateToProps = (state: AppState) => ({
    deviceCall: state.onboarding.connect.deviceCall,
    device: state.onboarding.connect.device,
    fetchCall: state.onboarding.fetchCall,
    firmwareUpdate: state.onboarding.firmwareUpdate,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
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
