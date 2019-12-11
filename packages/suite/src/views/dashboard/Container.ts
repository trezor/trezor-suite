import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import { Dispatch, AppState } from '@suite-types';
import Dashboard from './index';

const mapStateToProps = (state: AppState) => ({
    discovery: state.wallet.discovery,
    accounts: state.wallet.accounts,
    fiat: state.wallet.fiat,
    device: state.suite.device,
    localCurrency: state.wallet.settings.localCurrency,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    getDiscoveryForDevice: bindActionCreators(discoveryActions.getDiscoveryForDevice, dispatch),
});

export type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> &
    WrappedComponentProps;

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(Dashboard));
