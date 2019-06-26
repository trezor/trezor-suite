import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as connectActions from '@suite/actions/onboarding/connectActions';

import { Dispatch, AppState } from '@suite-types/index';

import Step from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.onboarding.connect.device,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    connectActions: {
        callActionAndGoToNextStep: bindActionCreators(
            connectActions.callActionAndGoToNextStep,
            dispatch,
        ),
    },
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Step);
