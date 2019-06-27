import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as newsletterActions from '@suite/actions/onboarding/newsletterActions';
import * as connectActions from '@suite/actions/onboarding/connectActions';

import { Dispatch, AppState } from '@suite-types/index';

import Step from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.onboarding.connect.device,
    newsletter: state.onboarding.newsletter,
    fetchCall: state.onboarding.fetchCall,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    connectActions: {
        callActionAndGoToNextStep: bindActionCreators(
            connectActions.callActionAndGoToNextStep,
            dispatch,
        ),
    },
    newsletterActions: {
        submitEmail: bindActionCreators(newsletterActions.submitEmail, dispatch),
        setEmail: bindActionCreators(newsletterActions.setEmail, dispatch),
        toggleCheckbox: bindActionCreators(newsletterActions.toggleCheckbox, dispatch),
        setSkipped: bindActionCreators(newsletterActions.setSkipped, dispatch),
    },
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Step);
