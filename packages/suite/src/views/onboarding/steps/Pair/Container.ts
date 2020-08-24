import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as routerActions from '@suite-actions/routerActions';
import * as suiteActions from '@suite-actions/suiteActions';
import * as notificationActions from '@suite-actions/notificationActions';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import { Dispatch, AppState } from '@suite-types';

import Step from './index';

const mapStateToProps = (state: AppState) => ({
    transport: state.suite.transport,
    device: state.suite.device,
    model: state.onboarding.selectedModel,
    debug: state.suite.settings.debug,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            goto: routerActions.goto,
            goToNextStep: onboardingActions.goToNextStep,
            goToPreviousStep: onboardingActions.goToPreviousStep,
            addToast: notificationActions.addToast,
            setDebugMode: suiteActions.setDebugMode,
        },
        dispatch,
    );

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default connect(mapStateToProps, mapDispatchToProps)(Step);
