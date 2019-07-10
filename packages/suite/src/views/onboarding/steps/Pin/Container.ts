import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { goToNextStep } from '@suite/actions/onboarding/onboardingActions';
import { submitNewPin, changePin } from '@suite/actions/onboarding/connectActions';
import { Dispatch, AppState } from '@suite-types/index';

import Step from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.onboarding.connect.device,
    deviceCall: state.onboarding.connect.deviceCall,
    activeSubStep: state.onboarding.activeSubStep,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: {
        goToNextStep: bindActionCreators(goToNextStep, dispatch),
    },
    connectActions: {
        changePin: bindActionCreators(changePin, dispatch),
        submitNewPin: bindActionCreators(submitNewPin, dispatch),
    },
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Step);
