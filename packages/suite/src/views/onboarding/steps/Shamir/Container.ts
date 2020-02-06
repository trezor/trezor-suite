import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import * as connectActions from '@onboarding-actions/connectActions';
import { AppState, Dispatch } from '@suite-types';
import Step from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    onboarding: state.onboarding,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    callActionAndGoToNextStep: bindActionCreators(
        connectActions.callActionAndGoToNextStep,
        dispatch,
    ),
    resetDevice: bindActionCreators(connectActions.resetDevice, dispatch),
    setBackupType: bindActionCreators(onboardingActions.setBackupType, dispatch),
    goToPreviousStep: bindActionCreators(onboardingActions.goToPreviousStep, dispatch),
});

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default connect(mapStateToProps, mapDispatchToProps)(Step);
