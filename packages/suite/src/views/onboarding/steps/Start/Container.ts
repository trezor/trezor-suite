import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { State } from '@suite/types/onboarding/actions';
import * as onboardingActions from '@suite/actions/onboarding/onboardingActions';
import * as recoveryActions from '@suite/actions/onboarding/recoveryActions';
import * as connectActions from '@suite/actions/onboarding/connectActions';

import { Dispatch } from '@suite-types/index';

import Step from './index';

const mapStateToProps = (state: State) => ({
    deviceCall: state.onboarding.connect.deviceCall,
    device: state.suite.device,
    uiInteraction: state.onboarding.connect.uiInteraction,
    recovery: state.onboarding.recovery,
    activeSubStep: state.onboarding.activeSubStep,
    isResolved: false, // todo: ???
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: bindActionCreators(onboardingActions, dispatch),
    recoveryActions: bindActionCreators(recoveryActions, dispatch),
    connectActions: bindActionCreators(connectActions, dispatch),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Step);
