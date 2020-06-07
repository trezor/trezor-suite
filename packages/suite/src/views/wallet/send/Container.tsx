import { AppState } from '@suite-types';
import { connect } from 'react-redux';

import Component from './index';

const mapStateToProps = (state: AppState) => ({
    selectedAccount: state.wallet.selectedAccount,
    send: state.wallet.send,
    accounts: state.wallet.accounts,
    fiat: state.wallet.fiat,
    settings: state.suite.settings,
    localCurrency: state.wallet.settings.localCurrency,
    fees: state.wallet.fees,
    device: state.suite.device,
    locks: state.suite.locks,
    online: state.suite.online,
});

const mapDispatchToProps = () => ({});

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type Props = StateProps & DispatchProps;

export default connect(mapStateToProps, mapDispatchToProps)(Component);
