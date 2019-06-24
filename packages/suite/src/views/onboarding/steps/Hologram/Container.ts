import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as onboardingActions from '@onboarding-actions/onboardingActions';

import { Dispatch, State } from '@suite-types/index';

import Step from './index';

const mapStateToProps = (state: State) => ({
    device: state.onboarding.connect.device,
    model: state.onboarding.selectedModel,
    activeSubStep: state.onboarding.activeSubStep,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: {
        goToPreviousStep: bindActionCreators(onboardingActions.goToPreviousStep, dispatch),
        goToNextStep: bindActionCreators(onboardingActions.goToNextStep, dispatch),
        goToSubStep: bindActionCreators(onboardingActions.goToSubStep, dispatch),
    },
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Step);
