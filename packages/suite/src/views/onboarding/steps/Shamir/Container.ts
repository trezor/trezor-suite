import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { AppState, Dispatch } from '@suite-types/index';

import { goToPreviousStep } from '@onboarding-actions/onboardingActions';
import { callActionAndGoToNextStep, resetDevice } from '@onboarding-actions/connectActions';

import Step from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.onboarding.connect.device,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    callActionAndGoToNextStep: bindActionCreators(callActionAndGoToNextStep, dispatch),
    goToPreviousStep: bindActionCreators(goToPreviousStep, dispatch),
    resetDevice: bindActionCreators(resetDevice, dispatch),
});

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Step);
