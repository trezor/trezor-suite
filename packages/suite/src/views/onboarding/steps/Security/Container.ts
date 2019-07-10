import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Dispatch } from '@suite-types/index';
import { goToNextStep } from '@suite/actions/onboarding/onboardingActions';
import { callActionAndGoToNextStep, resetDevice } from '@suite/actions/onboarding/connectActions';

import Step from './index';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goToNextStep: bindActionCreators(goToNextStep, dispatch),
    callActionAndGoToNextStep: bindActionCreators(callActionAndGoToNextStep, dispatch),
    resetDevice: bindActionCreators(resetDevice, dispatch),
});

export default connect(
    null,
    mapDispatchToProps,
)(Step);
