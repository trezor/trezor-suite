import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as onboardingActions from '@onboarding-actions/onboardingActions';
import * as suiteActions from '@suite-actions/suiteActions';

import { Dispatch } from '@suite-types';

import Step from './index';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goToNextStep: bindActionCreators(onboardingActions.goToNextStep, dispatch),
    exitApp: bindActionCreators(suiteActions.exitApp, dispatch),
});

export type Props = ReturnType<typeof mapDispatchToProps>;

export default connect(null, mapDispatchToProps)(Step);
