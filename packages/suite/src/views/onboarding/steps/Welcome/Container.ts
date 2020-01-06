import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { AppState } from '@suite/types/suite';
import * as suiteActions from '@suite-actions/suiteActions';
import * as onboardingActions from '@onboarding-actions/onboardingActions';

import { Dispatch } from '@suite-types';

import Step from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goToNextStep: bindActionCreators(onboardingActions.goToNextStep, dispatch),
    addPath: bindActionCreators(onboardingActions.addPath, dispatch),
    closeModalApp: bindActionCreators(suiteActions.closeModalApp, dispatch),
});

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default connect(mapStateToProps, mapDispatchToProps)(Step);
