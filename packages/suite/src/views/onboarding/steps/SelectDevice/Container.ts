import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
    goToNextStep,
    selectTrezorModel,
    goToPreviousStep,
} from '@suite/actions/onboarding/onboardingActions';
import { Dispatch } from '@suite-types/index';

import Step from './index';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: {
        goToNextStep: bindActionCreators(goToNextStep, dispatch),
        goToPreviousStep: bindActionCreators(goToPreviousStep, dispatch),
        selectTrezorModel: bindActionCreators(selectTrezorModel, dispatch),
    },
});

export default connect(
    null,
    mapDispatchToProps,
)(Step);
