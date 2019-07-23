import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as onboardingActions from '@suite/actions/onboarding/onboardingActions';

import { Dispatch, AppState } from '@suite-types/index';

import Step from './index';

const mapStateToProps = (state: AppState) => ({
    path: state.onboarding.path,
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
