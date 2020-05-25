import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as onboardingActions from '@onboarding-actions/onboardingActions';
import * as backupActions from '@backup-actions/backupActions';
import * as routerActions from '@suite-actions/routerActions';

import { Dispatch, AppState } from '@suite-types';

import Step from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    backup: state.backup,
    locks: state.suite.locks,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            goToNextStep: onboardingActions.goToNextStep,
            backupDevice: backupActions.backupDevice,
            goto: routerActions.goto,
            closeModalApp: routerActions.closeModalApp,
        },
        dispatch,
    );

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default connect(mapStateToProps, mapDispatchToProps)(Step);
