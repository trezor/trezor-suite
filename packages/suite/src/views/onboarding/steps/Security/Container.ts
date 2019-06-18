import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Dispatch } from '@suite-types/index';
import * as onboardingActions from '@suite/actions/onboarding/onboardingActions';

import Step from './index';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: bindActionCreators(onboardingActions, dispatch),
});

export default connect(
    null,
    mapDispatchToProps,
)(Step);
