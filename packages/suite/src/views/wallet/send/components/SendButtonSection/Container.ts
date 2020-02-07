import { AppState, Dispatch } from '@suite-types';
import * as sendFormActionsBitcoin from '@wallet-actions/send/sendFormBitcoinActions';
import * as sendFormActionsEthereum from '@wallet-actions/send/sendFormEthereumActions';
import * as sendFormActionsRipple from '@wallet-actions/send/sendFormRippleActions';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import Component from './index';

const mapStateToProps = (state: AppState) => ({
    account: state.wallet.selectedAccount.account,
    send: state.wallet.send,
    suite: state.suite,
    device: state.suite.device,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    sendFormActionsBitcoin: bindActionCreators(sendFormActionsBitcoin, dispatch),
    sendFormActionsRipple: bindActionCreators(sendFormActionsRipple, dispatch),
    sendFormActionsEthereum: bindActionCreators(sendFormActionsEthereum, dispatch),
});

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type Props = StateProps & DispatchProps;

export default connect(mapStateToProps, mapDispatchToProps)(Component);
