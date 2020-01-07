import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
    goToNextStep,
    selectTrezorModel,
    goToPreviousStep,
} from '@onboarding-actions/onboardingActions';
import { Dispatch } from '@suite-types';

import Step from './index';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: {
        goToNextStep: bindActionCreators(goToNextStep, dispatch),
        goToPreviousStep: bindActionCreators(goToPreviousStep, dispatch),
        selectTrezorModel: bindActionCreators(selectTrezorModel, dispatch),
    },
});

export type Props = ReturnType<typeof mapDispatchToProps>;

export default connect(null, mapDispatchToProps)(Step);
