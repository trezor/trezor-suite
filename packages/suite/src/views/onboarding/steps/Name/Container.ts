import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as onboardingActions from '@suite/actions/onboarding/onboardingActions';
import * as connectActions from '@suite/actions/onboarding/connectActions';

import { Dispatch, State } from '@suite-types/index';

import Step from './index';

const mapStateToProps = (state: State) => ({
    deviceCall: state.onboarding.connect.deviceCall,
    device: state.onboarding.connect.device,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: {
        goToNextStep: bindActionCreators(onboardingActions.goToNextStep, dispatch),
    },
    connectActions: {
        applySettings: bindActionCreators(connectActions.applySettings, dispatch),
    },
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Step);
