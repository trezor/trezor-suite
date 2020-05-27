import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as routerActions from '@suite-actions/routerActions';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import { Dispatch } from '@suite-types';

import Step from './index';

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            closeModalApp: routerActions.closeModalApp,
            goToNextStep: onboardingActions.goToNextStep,
        },
        dispatch,
    );

export type Props = ReturnType<typeof mapDispatchToProps>;

export default connect(null, mapDispatchToProps)(Step);
