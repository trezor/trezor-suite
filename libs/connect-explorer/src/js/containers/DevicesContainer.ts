import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Devices from '../components/Devices';
import * as TrezorConnectActions from '../actions/TrezorConnectActions';
import { AppState, Dispatch } from '../types';

function mapStateToProps(state: AppState, own) {
    return {
        connect: state.connect,
    };
}

function mapDispatchToProps(dispatch: Dispatch) {
    return {
        onSelectDevice: bindActionCreators(TrezorConnectActions.onSelectDevice, dispatch),
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Devices);
