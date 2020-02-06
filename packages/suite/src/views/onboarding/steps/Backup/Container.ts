import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as onboardingActions from '@onboarding-actions/onboardingActions';
import * as connectActions from '@onboarding-actions/connectActions';
import * as routerActions from '@suite-actions/routerActions';
import * as backupActions from '@backup-actions/backupActions';

import { Dispatch, AppState } from '@suite-types';

import Step from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    backup: state.backup,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goToSubStep: bindActionCreators(onboardingActions.goToSubStep, dispatch),
    goToNextStep: bindActionCreators(onboardingActions.goToNextStep, dispatch),
    wipeDevice: bindActionCreators(connectActions.wipeDevice, dispatch),
    resetDevice: bindActionCreators(connectActions.resetDevice, dispatch),
    resetCall: bindActionCreators(connectActions.resetCall, dispatch),
    backupDevice: bindActionCreators(backupActions.backupDevice, dispatch),
    retryBackup: bindActionCreators(onboardingActions.retryBackup, dispatch),
    goto: bindActionCreators(routerActions.goto, dispatch),
});

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default connect(mapStateToProps, mapDispatchToProps)(Step);
