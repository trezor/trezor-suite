import { connect } from 'react-redux';
import { AppState, InjectedModalApplicationProps } from '@suite-types';
import Component from './index';

const mapStateToProps = (state: AppState) => ({
    router: state.router,
    selectedDevice: state.suite.device,
    devices: state.devices,
    transport: state.suite.transport,
});

export type Props = ReturnType<typeof mapStateToProps> & InjectedModalApplicationProps;

export default connect(mapStateToProps)(Component);
