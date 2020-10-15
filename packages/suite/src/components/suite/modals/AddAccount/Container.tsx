import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { changeAccountVisibility } from '@wallet-actions/accountActions';
import { changeCoinVisibility } from '@settings-actions/walletSettingsActions';
import * as routerActions from '@suite-actions/routerActions';
import { AppState, Dispatch, TrezorDevice } from '@suite-types';
import Index from './index';
import { Account } from '@wallet-types';

const mapStateToProps = (state: AppState) => ({
    app: state.router.app,
    accounts: state.wallet.accounts,
    enabledNetworks: state.wallet.settings.enabledNetworks,
    selectedAccount: state.wallet.selectedAccount,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            changeAccountVisibility,
            changeCoinVisibility,
            goto: routerActions.goto,
        },
        dispatch,
    );

export type Props = {
    device: TrezorDevice;
    onCancel: () => void;
    symbol?: Account['symbol'];
    noRedirect?: boolean;
} & ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps>;

export default connect(mapStateToProps, mapDispatchToProps)(Index);
