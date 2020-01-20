import { connect } from 'react-redux';
import { AppState } from '@suite-types';
import Component from './index';

const mapStateToProps = (state: AppState) => ({
    account: state.wallet.selectedAccount.account,
    fiat: state.wallet.fiat,
    settings: state.wallet.settings,
    send: state.wallet.send,
});

export type StateProps = ReturnType<typeof mapStateToProps>;
export type Props = StateProps;

export default connect(mapStateToProps, null)(Component);
