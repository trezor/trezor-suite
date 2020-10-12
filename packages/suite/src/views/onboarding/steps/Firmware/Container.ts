import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { injectIntl, WrappedComponentProps } from 'react-intl';

import * as onboardingActions from '@onboarding-actions/onboardingActions';
import * as firmwareActions from '@suite/actions/firmware/firmwareActions';

import { Dispatch, AppState } from '@suite-types';
import Step from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    firmware: state.firmware,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            goToNextStep: onboardingActions.goToNextStep,
            goToPreviousStep: onboardingActions.goToPreviousStep,
            resetReducer: firmwareActions.resetReducer,
            firmwareUpdate: firmwareActions.firmwareUpdate,
        },
        dispatch,
    );

export type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> &
    WrappedComponentProps;

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(Step));
