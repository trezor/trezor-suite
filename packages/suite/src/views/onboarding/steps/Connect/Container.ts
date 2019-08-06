import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as onboardingActions from '@suite/actions/onboarding/onboardingActions';
import { Dispatch, AppState } from '@suite-types';

import Step from './index';

const mapStateToProps = (state: AppState) => ({
    model: state.onboarding.selectedModel,
    deviceCall: state.onboarding.connect.deviceCall,
    device: state.onboarding.connect.device,
    isResolved: false, // todo: maybe add maybe not.
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: {
        goToNextStep: bindActionCreators(onboardingActions.goToNextStep, dispatch),
    },
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Step);
