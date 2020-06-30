import { connect } from 'react-redux';
import { AppState } from '@suite-types';
import Component from './index';

const mapStateToProps = (state: AppState) => ({
    selectedAccount: state.wallet.selectedAccount,
    accounts: state.wallet.accounts,
    fiat: state.wallet.fiat,
    settings: state.suite.settings,
    localCurrency: state.wallet.settings.localCurrency,
    fees: state.wallet.fees,
    device: state.suite.device,
    locks: state.suite.locks, // todo: use lock hooks
    online: state.suite.online,
});

export type Props = ReturnType<typeof mapStateToProps>;

export default connect(mapStateToProps)(Component);
