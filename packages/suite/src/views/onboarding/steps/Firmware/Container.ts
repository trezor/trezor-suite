import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { injectIntl, InjectedIntlProps } from 'react-intl';

import * as firmwareUpdateActions from '@suite-actions/firmwareActions';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import { Dispatch, AppState } from '@suite-types';
import Step from './index';

const mapStateToProps = (state: AppState) => ({
    deviceCall: state.onboarding.deviceCall,
    device: state.suite.device,
    prevDevice: state.onboarding.prevDevice,
    firmwareUpdate: state.firmware,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: {
        goToNextStep: bindActionCreators(onboardingActions.goToNextStep, dispatch),
        goToPreviousStep: bindActionCreators(onboardingActions.goToPreviousStep, dispatch),
    },
    firmwareUpdateActions: {
        firmwareUpdate: bindActionCreators(firmwareUpdateActions.firmwareUpdate, dispatch),
    },
});

export type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> &
    InjectedIntlProps;

export default injectIntl(
    connect(
        mapStateToProps,
        mapDispatchToProps,
    )(Step),
);
