import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as onboardingActions from '@suite/actions/onboarding/onboardingActions';
import { Dispatch, State } from '@suite-types/index';

import Step from './index';

const mapStateToProps = (state: State) => ({
    asNewDevice: state.onboarding.asNewDevice,
    device: state.onboarding.connect.device,
    model: state.onboarding.selectedModel,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: bindActionCreators(onboardingActions, dispatch),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Step);
