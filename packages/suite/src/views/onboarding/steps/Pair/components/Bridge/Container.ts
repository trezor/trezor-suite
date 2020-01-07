import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as onboardingActions from '@onboarding-actions/onboardingActions';

import { AppState, Dispatch } from '@suite-types';

import Step from './index';

const mapStateToProps = (state: AppState) => ({
    activeSubStep: state.onboarding.activeSubStep,
    transport: state.suite.transport,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: {
        goToSubStep: bindActionCreators(onboardingActions.goToSubStep, dispatch),
        goToNextStep: bindActionCreators(onboardingActions.goToNextStep, dispatch),
        goToPreviousStep: bindActionCreators(onboardingActions.goToPreviousStep, dispatch),
    },
});

export default connect(mapStateToProps, mapDispatchToProps)(Step);
