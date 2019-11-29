import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as onboardingActions from '@onboarding-actions/onboardingActions';

import { Dispatch, AppState } from '@suite-types';

import Step from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
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

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default connect(mapStateToProps, mapDispatchToProps)(Step);
