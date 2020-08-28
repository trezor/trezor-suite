import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as routerActions from '@suite-actions/routerActions';
import * as suiteActions from '@suite-actions/suiteActions';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import * as metadataActions from '@suite-actions/metadataActions';

import { AppState, Dispatch, TrezorDevice, AcquiredDevice } from '@suite-types';
import WalletInstance from './index';
import { injectIntl, WrappedComponentProps } from 'react-intl';

const mapStateToProps = (state: AppState) => ({
    accounts: state.wallet.accounts,
    fiat: state.wallet.fiat,
    localCurrency: state.wallet.settings.localCurrency,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            goto: routerActions.goto,
            rememberDevice: suiteActions.rememberDevice,
            forgetDevice: suiteActions.forgetDevice,
            getDiscovery: discoveryActions.getDiscovery,
            selectDevice: suiteActions.selectDevice,
            addMetadata: metadataActions.addMetadata,
        },
        dispatch,
    );

interface OwnProps extends WrappedComponentProps {
    instance: AcquiredDevice;
    enabled: boolean;
    selected: boolean;
    selectDeviceInstance: (instance: TrezorDevice) => void;
}

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type Props = StateProps & DispatchProps & OwnProps;

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(WalletInstance));
