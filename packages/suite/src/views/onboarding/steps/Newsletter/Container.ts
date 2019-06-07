import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { State } from '@suite/types/onboarding/actions';
import * as newsletterActions from '@suite/actions/onboarding/newsletterActions';
import * as connectActions from '@suite/actions/onboarding/connectActions';

import { Dispatch } from '@suite-types/index';

import Step from './index';

const mapStateToProps = (state: State) => ({
    device: state.suite.device,
    newsletter: state.onboarding.newsletter,
    fetchCall: state.onboarding.fetchCall,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: bindActionCreators(onboardingActions, dispatch),
    newsletterActions: bindActionCreators(connectActions, dispatch),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Step);
