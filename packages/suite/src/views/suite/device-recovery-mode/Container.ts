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

const mapDispatchToProps = (dispatch: Dispatch) => ({
    // todo: check if not dry_run
    addPath: bindActionCreators(onboardingActions.addPath, dispatch),
    goToStep: bindActionCreators(onboardingActions.goToStep, dispatch),
    recoverDevice: bindActionCreators(recoveryActions.recoverDevice, dispatch),
    checkSeed: bindActionCreators(recoveryActions.checkSeed, dispatch),
});

export type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> &
    WrappedComponentProps;

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(View));
