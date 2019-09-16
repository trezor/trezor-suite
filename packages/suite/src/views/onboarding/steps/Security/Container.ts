import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { goToNextStep } from '@suite/actions/onboarding/onboardingActions';
import { Dispatch } from '@suite-types';

import Step from './index';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goToNextStep: bindActionCreators(goToNextStep, dispatch),
});

export type Props = ReturnType<typeof mapDispatchToProps>;

export default connect(
    null,
    mapDispatchToProps,
)(Step);
