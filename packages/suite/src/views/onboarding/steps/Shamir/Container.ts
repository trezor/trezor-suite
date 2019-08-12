import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { AppState, Dispatch } from '@suite-types/index';

import { goToNextStep } from '@onboarding-actions/onboardingActions';
import { callActionAndGoToNextStep, resetDevice } from '@onboarding-actions/connectActions';

import Step from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.onboarding.connect.device,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goToNextStep: bindActionCreators(goToNextStep, dispatch),
    callActionAndGoToNextStep: bindActionCreators(callActionAndGoToNextStep, dispatch),
    resetDevice: bindActionCreators(resetDevice, dispatch),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Step);
