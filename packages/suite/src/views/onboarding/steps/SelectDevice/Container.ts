import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { goToNextStep, selectTrezorModel } from '@suite/actions/onboarding/onboardingActions';
import { Dispatch, AppState } from '@suite-types/index';

import Step from './index';

const mapStateToProps = (state: AppState) => ({
    asNewDevice: state.onboarding.asNewDevice,
    device: state.onboarding.connect.device,
    model: state.onboarding.selectedModel,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: {
        goToNextStep: bindActionCreators(goToNextStep, dispatch),
        selectTrezorModel: bindActionCreators(selectTrezorModel, dispatch),
    },
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Step);
