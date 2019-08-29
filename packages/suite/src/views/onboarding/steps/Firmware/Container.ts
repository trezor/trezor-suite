import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as firmwareUpdateActions from '@suite-actions/firmwareActions';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import { Dispatch, AppState } from '@suite-types';
import Step from './index';

const mapStateToProps = (state: AppState) => ({
    deviceCall: state.onboarding.connect.deviceCall,
    device: state.onboarding.connect.device,
    firmwareUpdate: state.firmware,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: {
        goToNextStep: bindActionCreators(onboardingActions.goToNextStep, dispatch),
    },
    firmwareUpdateActions: {
        firmwareUpdate: bindActionCreators(firmwareUpdateActions.firmwareUpdate, dispatch),
    },
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Step);
