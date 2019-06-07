import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { State } from '@suite/types/onboarding/actions';
import * as onboardingActions from '@suite/actions/onboarding/onboardingActions';
import * as firmwareUpdateActions from '@suite/actions/onboarding/firmwareUpdateActions';

import { Dispatch } from '@suite/types';

import Step from './index';

const mapStateToProps = (state: State) => ({
    deviceCall: state.onboarding.connect.deviceCall,
    device: state.suite.device,
    fetchCall: state.onboarding.fetchCall,
    firmwareUpdate: state.onboarding.firmwareUpdate,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: bindActionCreators(onboardingActions, dispatch),
    firmwareUpdateActions: bindActionCreators(firmwareUpdateActions, dispatch),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Step);
