import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { injectIntl, WrappedComponentProps } from 'react-intl';

import * as newsletterActions from '@suite/actions/onboarding/newsletterActions';
import * as connectActions from '@suite/actions/onboarding/connectActions';

import { Dispatch, AppState } from '@suite-types';

import Step from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    newsletter: state.onboarding.newsletter,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    connectActions: {
        applyFlags: bindActionCreators(connectActions.applyFlags, dispatch),
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

export type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> &
    WrappedComponentProps;

export default injectIntl(
    connect(
        mapStateToProps,
        mapDispatchToProps,
    )(Step),
);
