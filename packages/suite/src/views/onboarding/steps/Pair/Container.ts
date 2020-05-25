import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as routerActions from '@suite-actions/routerActions';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import { Dispatch, AppState } from '@suite-types';

import Step from './index';

const mapStateToProps = (state: AppState) => ({
    transport: state.suite.transport,
    device: state.suite.device,
    model: state.onboarding.selectedModel,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            goto: routerActions.goto,
            goToNextStep: onboardingActions.goToNextStep,
            goToPreviousStep: onboardingActions.goToPreviousStep,
        },
        dispatch,
    );

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default connect(mapStateToProps, mapDispatchToProps)(Step);
