import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as onboardingActions from '@suite/actions/onboarding/onboardingActions';

import { Dispatch } from '@suite-types/index';

import Step from './index';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: {
        setAsNewDevice: bindActionCreators(onboardingActions.setAsNewDevice, dispatch),
        goToNextStep: bindActionCreators(onboardingActions.goToNextStep, dispatch),
    },
});

export default connect(
    null,
    mapDispatchToProps,
)(Step);
