import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { injectIntl, InjectedIntlProps } from 'react-intl';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import * as recoveryActions from '@onboarding-actions/recoveryActions';
import * as connectActions from '@onboarding-actions/connectActions';
import { Dispatch, AppState } from '@suite-types';

import Step from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.onboarding.connect.device,
    deviceCall: state.onboarding.connect.deviceCall,
    uiInteraction: state.onboarding.connect.uiInteraction,
    recovery: state.onboarding.recovery,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: {
        goToNextStep: bindActionCreators(onboardingActions.goToNextStep, dispatch),
        goToSubStep: bindActionCreators(onboardingActions.goToSubStep, dispatch),
    },
    recoveryActions: {
        setWordsCount: bindActionCreators(recoveryActions.setWordsCount, dispatch),
        setWord: bindActionCreators(recoveryActions.setWord, dispatch),
        submit: bindActionCreators(recoveryActions.submit, dispatch),
        setAdvancedRecovery: bindActionCreators(recoveryActions.setAdvancedRecovery, dispatch),
    },
    connectActions: {
        recoveryDevice: bindActionCreators(connectActions.recoveryDevice, dispatch),
        resetCall: bindActionCreators(connectActions.resetCall, dispatch),
    },
});

export type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> &
    InjectedIntlProps;

export default injectIntl(
    connect(
        mapStateToProps,
        mapDispatchToProps,
    )(Step),
);
