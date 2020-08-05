import { connect } from 'react-redux';
import { AppState } from '@suite-types';
import Component from './index';

const mapStateToProps = (state: AppState) => ({
    selectedAccount: state.wallet.selectedAccount,
    fiat: state.wallet.fiat,
    settings: state.wallet.settings,
    send: state.wallet.send,
});

export type Props = ReturnType<typeof mapStateToProps>;

export default connect(mapStateToProps)(Component);
