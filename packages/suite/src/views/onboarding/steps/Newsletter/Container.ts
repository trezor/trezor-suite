import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as newsletterActions from '@suite/actions/onboarding/newsletterActions';
import * as connectActions from '@suite/actions/onboarding/connectActions';

import { Dispatch, State } from '@suite-types/index';

import Step from './index';

const mapStateToProps = (state: State) => ({
    device: state.onboarding.connect.device,
    newsletter: state.onboarding.newsletter,
    fetchCall: state.onboarding.fetchCall,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    connectActions: bindActionCreators(connectActions, dispatch),
    newsletterActions: bindActionCreators(newsletterActions, dispatch),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Step);
