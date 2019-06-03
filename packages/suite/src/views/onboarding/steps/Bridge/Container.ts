import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { State } from 'types/redux';
import * as onboardingActions from '@suite/actions/onboarding/onboardingActions';

import { Dispatch } from '@suite/types';

import Step from './index';

const mapStateToProps = (state: State) => ({
    activeSubStep: state.onboarding.activeSubStep,
    transport: state.suite.transport,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: bindActionCreators(onboardingActions, dispatch),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Step);