import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as onboardingActions from '@suite/actions/onboarding/onboardingActions';
import * as connectActions from '@suite/actions/onboarding/connectActions';

import { Dispatch, AppState } from '@suite-types';

import Step from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.onboarding.connect.device,
    // deviceInteraction: state.onboarding.connect.deviceInteraction,
    uiInteraction: state.onboarding.connect.uiInteraction,
    deviceCall: state.onboarding.connect.deviceCall,
    activeSubStep: state.onboarding.activeSubStep,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: {
        goToSubStep: bindActionCreators(onboardingActions.goToSubStep, dispatch),
        goToNextStep: bindActionCreators(onboardingActions.goToNextStep, dispatch),
    },
    connectActions: {
        wipeDevice: bindActionCreators(connectActions.wipeDevice, dispatch),
        callActionAndGoToNextStep: bindActionCreators(
            connectActions.callActionAndGoToNextStep,
            dispatch,
        ),
        resetDevice: bindActionCreators(connectActions.resetDevice, dispatch),
        resetCall: bindActionCreators(connectActions.resetCall, dispatch),
        backupDevice: bindActionCreators(connectActions.backupDevice, dispatch),
    },
});

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Step);
