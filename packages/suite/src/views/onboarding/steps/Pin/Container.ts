import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { State } from '@suite/types/onboarding/actions';
import * as onboardingActions from '@suite/actions/onboarding/onboardingActions';
import * as connectActions from '@suite/actions/onboarding/connectActions';

import { Dispatch } from '@suite/types';

import Step from './index';

const mapStateToProps = (state: State) => ({
    device: state.suite.device,
    deviceCall: state.onboarding.connect.deviceCall,
    activeSubStep: state.onboarding.activeSubStep,
    uiInteraction: state.onboarding.connect.uiInteraction,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: bindActionCreators(onboardingActions, dispatch),
    connectActions: bindActionCreators(connectActions, dispatch),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Step);
