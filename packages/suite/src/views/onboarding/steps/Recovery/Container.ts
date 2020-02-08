import React from 'react';
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

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goToNextStep: bindActionCreators(onboardingActions.goToNextStep, dispatch),
    goToPreviousStep: bindActionCreators(onboardingActions.goToPreviousStep, dispatch),
    setWordsCount: bindActionCreators(recoveryActions.setWordsCount, dispatch),
    setAdvancedRecovery: bindActionCreators(recoveryActions.setAdvancedRecovery, dispatch),
    recoverDevice: bindActionCreators(recoveryActions.recoverDevice, dispatch),
    setStatus: bindActionCreators(recoveryActions.setStatus, dispatch),
    resetReducer: bindActionCreators(recoveryActions.resetReducer, dispatch),
});

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default connect(mapStateToProps, mapDispatchToProps)(Step);
