import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Dispatch } from '@suite-types/index';
import { goToNextStep } from '@suite/actions/onboarding/onboardingActions';

import Step from './index';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goToNextStep: bindActionCreators(goToNextStep, dispatch),
});

export default connect(
    null,
    mapDispatchToProps,
)(Step);
