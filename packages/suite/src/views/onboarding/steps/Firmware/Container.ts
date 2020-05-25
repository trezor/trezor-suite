import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { injectIntl, WrappedComponentProps } from 'react-intl';

import * as firmwareUpdateActions from '@firmware-actions/firmwareActions';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import { Dispatch, AppState } from '@suite-types';
import Step from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    transport: state.suite.transport,
    firmware: state.firmware,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            goToNextStep: onboardingActions.goToNextStep,
            goToPreviousStep: onboardingActions.goToPreviousStep,
            firmwareUpdate: firmwareUpdateActions.firmwareUpdate,
            toggleBtcOnly: firmwareUpdateActions.toggleBtcOnly,
        },
        dispatch,
    );

export type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> &
    WrappedComponentProps;

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(Step));
