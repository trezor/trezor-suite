import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { AppState, Dispatch } from '@suite-types';
import Step from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    resetDevice: bindActionCreators(deviceSettingsActions.resetDevice, dispatch),
    goToPreviousStep: bindActionCreators(onboardingActions.goToPreviousStep, dispatch),
    callActionAndGoToNextStep: bindActionCreators(
        onboardingActions.callActionAndGoToNextStep,
        dispatch,
    ),
});

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default connect(mapStateToProps, mapDispatchToProps)(Step);
