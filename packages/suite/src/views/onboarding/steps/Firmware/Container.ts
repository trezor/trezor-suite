import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { injectIntl, WrappedComponentProps } from 'react-intl';

import * as firmwareUpdateActions from '@firmware-actions/firmwareActions';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import { Dispatch, AppState } from '@suite-types';
import Step from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    firmware: state.firmware,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goToNextStep: bindActionCreators(onboardingActions.goToNextStep, dispatch),
    goToPreviousStep: bindActionCreators(onboardingActions.goToPreviousStep, dispatch),
    firmwareUpdate: bindActionCreators(firmwareUpdateActions.firmwareUpdate, dispatch),
    toggleBtcOnly: bindActionCreators(firmwareUpdateActions.toggleBtcOnly, dispatch),
});

export type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> &
    WrappedComponentProps;

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(Step));
