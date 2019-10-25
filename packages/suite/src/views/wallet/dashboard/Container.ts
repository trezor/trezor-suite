import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import * as routerActions from '@suite-actions/routerActions';
import { AppState, Dispatch } from '@suite-types';
import Dashboard from './index';

const mapStateToProps = (state: AppState) => ({
    accounts: state.wallet.accounts,
    discovery: state.wallet.discovery,
    settings: state.wallet.settings,
    device: state.suite.device,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    getDiscoveryForDevice: () => dispatch(discoveryActions.getDiscoveryForDevice()),
    goto: bindActionCreators(routerActions.goto, dispatch),
});

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Dashboard);
