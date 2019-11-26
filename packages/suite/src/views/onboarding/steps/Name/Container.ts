import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { injectIntl, WrappedComponentProps } from 'react-intl';

import * as onboardingActions from '@suite/actions/onboarding/onboardingActions';
import * as connectActions from '@suite/actions/onboarding/connectActions';

import { Dispatch, AppState } from '@suite-types';

import Step from './index';

const mapStateToProps = (state: AppState) => ({
    deviceCall: state.onboarding.deviceCall,
    device: state.suite.device,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: {
        goToNextStep: bindActionCreators(onboardingActions.goToNextStep, dispatch),
    },
    connectActions: {
        applySettings: bindActionCreators(connectActions.applySettings, dispatch),
    },
});

export type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> &
    WrappedComponentProps;

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(Step));
