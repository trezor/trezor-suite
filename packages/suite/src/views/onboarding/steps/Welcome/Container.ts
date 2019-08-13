import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { AppState } from '@suite/types/suite';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import { Dispatch } from '@suite-types';

import Step from './index';

const mapStateToProps = (state: AppState) => ({
    suite: state.suite,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: {
        goToNextStep: bindActionCreators(onboardingActions.goToNextStep, dispatch),
        setPath: bindActionCreators(onboardingActions.setPath, dispatch),
    },
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Step);
