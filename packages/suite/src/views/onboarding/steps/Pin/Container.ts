import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { goToNextStep } from '@suite/actions/onboarding/onboardingActions';
import { submitNewPin, changePin } from '@suite/actions/onboarding/connectActions';
import { Dispatch, AppState } from '@suite-types';

import Step from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    deviceCall: state.onboarding.deviceCall,
    activeSubStep: state.onboarding.activeSubStep,
    uiInteraction: state.onboarding.uiInteraction,
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

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default connect(mapStateToProps, mapDispatchToProps)(Step);
