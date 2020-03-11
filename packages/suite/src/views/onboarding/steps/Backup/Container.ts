import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as onboardingActions from '@onboarding-actions/onboardingActions';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import * as backupActions from '@backup-actions/backupActions';
import * as routerActions from '@suite-actions/routerActions';

import { Dispatch, AppState } from '@suite-types';

import Step from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    backup: state.backup,
    locks: state.suite.locks,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goToSubStep: bindActionCreators(onboardingActions.goToSubStep, dispatch),
    goToNextStep: bindActionCreators(onboardingActions.goToNextStep, dispatch),
    wipeDevice: bindActionCreators(deviceSettingsActions.wipeDevice, dispatch),
    resetDevice: bindActionCreators(deviceSettingsActions.resetDevice, dispatch),
    backupDevice: bindActionCreators(backupActions.backupDevice, dispatch),
    retryBackup: bindActionCreators(onboardingActions.retryBackup, dispatch),
    goto: bindActionCreators(routerActions.goto, dispatch),
});

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default connect(mapStateToProps, mapDispatchToProps)(Step);
