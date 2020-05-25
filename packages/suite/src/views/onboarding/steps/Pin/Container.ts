import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { goToNextStep } from '@onboarding-actions/onboardingActions';
import { changePin } from '@settings-actions/deviceSettingsActions';
import { Dispatch, AppState } from '@suite-types';

import Step from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    activeSubStep: state.onboarding.activeSubStep,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            goToNextStep,
            changePin,
        },
        dispatch,
    );

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default connect(mapStateToProps, mapDispatchToProps)(Step);
