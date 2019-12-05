import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as routerActions from '@suite-actions/routerActions';
import * as suiteActions from '@suite-actions/suiteActions';
import * as modalActions from '@suite-actions/modalActions';
import * as discoveryActions from '@wallet-actions/discoveryActions';

import { AppState, Dispatch, TrezorDevice, AcquiredDevice } from '@suite-types';
import WalletInstance from './index';
import { injectIntl, WrappedComponentProps } from 'react-intl';

const mapStateToProps = (state: AppState) => ({
    accounts: state.wallet.accounts,
    fiat: state.wallet.fiat,
    localCurrency: state.wallet.settings.localCurrency,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
    forgetDeviceInstance: bindActionCreators(modalActions.onForgetDeviceInstance, dispatch),
    getDiscovery: bindActionCreators(discoveryActions.getDiscovery, dispatch),
    selectDevice: bindActionCreators(suiteActions.selectDevice, dispatch),
    requestDeviceInstance: bindActionCreators(suiteActions.requestDeviceInstance, dispatch),
});

interface OwnProps extends WrappedComponentProps {
    instance: AcquiredDevice;
    active: boolean;
    selectInstance: (instance: TrezorDevice) => void;
}

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type Props = StateProps & DispatchProps & OwnProps;

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(WalletInstance));
