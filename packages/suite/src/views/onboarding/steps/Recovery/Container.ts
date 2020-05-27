import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as onboardingActions from '@onboarding-actions/onboardingActions';
import * as recoveryActions from '@recovery-actions/recoveryActions';
import { AppState, Dispatch } from '@suite-types';

import Step from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    recovery: state.recovery,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            goToNextStep: onboardingActions.goToNextStep,
            goToPreviousStep: onboardingActions.goToPreviousStep,
            setWordsCount: recoveryActions.setWordsCount,
            setAdvancedRecovery: recoveryActions.setAdvancedRecovery,
            recoverDevice: recoveryActions.recoverDevice,
            setStatus: recoveryActions.setStatus,
            resetReducer: recoveryActions.resetReducer,
        },
        dispatch,
    );

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default connect(mapStateToProps, mapDispatchToProps)(Step);
