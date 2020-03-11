import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { changeAccountVisibility } from '@wallet-actions/accountActions';
import { changeCoinVisibility } from '@settings-actions/walletSettingsActions';
import * as routerActions from '@suite-actions/routerActions';
import { AppState, Dispatch, TrezorDevice } from '@suite-types';
import Index from './index';

const mapStateToProps = (state: AppState) => ({
    accounts: state.wallet.accounts,
    enabledNetworks: state.wallet.settings.enabledNetworks,
    selectedAccount: state.wallet.selectedAccount,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    changeAccountVisibility: bindActionCreators(changeAccountVisibility, dispatch),
    changeCoinVisibility: bindActionCreators(changeCoinVisibility, dispatch),
    goto: bindActionCreators(routerActions.goto, dispatch),
});

export type Props = {
    device: TrezorDevice;
    onCancel: () => void;
} & ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps>;

export default connect(mapStateToProps, mapDispatchToProps)(Index);
