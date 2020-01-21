import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import { AppState, Dispatch } from '@suite-types';
import AdditionalFormBitcoin from './index';

const mapStateToProps = (state: AppState) => ({
    account: state.wallet.selectedAccount.account,
    settings: state.wallet.settings,
    send: state.wallet.send,
    fiat: state.wallet.fiat,
    device: state.suite.device,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    sendFormActions: bindActionCreators(sendFormActions, dispatch),
});

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type Props = StateProps & DispatchProps;

export default connect(mapStateToProps, mapDispatchToProps)(AdditionalFormBitcoin);
