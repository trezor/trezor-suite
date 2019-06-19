import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as onboardingActions from '@suite/actions/onboarding/onboardingActions';
import * as connectActions from '@suite/actions/onboarding/connectActions';

import { Dispatch, State } from '@suite-types/index';

import Step from './index';

const mapStateToProps = (state: State) => ({
    device: state.onboarding.connect.device,
    deviceInteraction: state.onboarding.connect.deviceInteraction,
    deviceCall: state.onboarding.connect.deviceCall,
    activeSubStep: state.onboarding.activeSubStep,
    fetchCall: state.onboarding.fetchCall,
    firmwareUpdate: state.onboarding.firmwareUpdate,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: bindActionCreators(onboardingActions, dispatch),
    connectActions: bindActionCreators(connectActions, dispatch),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Step);
