import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as recoveryActions from '@recovery-actions/recoveryActions';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import { Dispatch, AppState } from '@suite-types';
import View from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    recovery: state.recovery,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            addPath: onboardingActions.addPath,
            goToStep: onboardingActions.goToStep,
            rerun: recoveryActions.rerun,
        },
        dispatch,
    );

export type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> &
    WrappedComponentProps;

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(View));
