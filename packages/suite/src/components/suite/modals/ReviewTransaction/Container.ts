import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Output } from '@wallet-hooks/useSendContext';
import { TokenInfo, PrecomposedTransaction } from 'trezor-connect';
import * as modalActions from '@suite-actions/modalActions';
import * as sendFormActionsBitcoin from '@wallet-actions/send/sendFormBitcoinActions';
import * as sendFormActionsEthereum from '@wallet-actions/send/sendFormEthereumActions';
import * as sendFormActionsRipple from '@wallet-actions/send/sendFormRippleActions';

import { AppState, Dispatch } from '@suite-types';
import Component from './index';

const mapStateToProps = (state: AppState) => ({
    account: state.wallet.selectedAccount.account,
    suite: state.suite,
    fiat: state.wallet.fiat,
    settings: state.wallet.settings,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    modalActions: bindActionCreators(modalActions, dispatch),
    sendFormActionsBitcoin: bindActionCreators(sendFormActionsBitcoin, dispatch),
    sendFormActionsRipple: bindActionCreators(sendFormActionsRipple, dispatch),
    sendFormActionsEthereum: bindActionCreators(sendFormActionsEthereum, dispatch),
});

interface ComponentProps {
    transactionInfo: PrecomposedTransaction;
    outputs: Output[];
    token: TokenInfo | null;
    formValues: any;
}

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type Props = StateProps & DispatchProps & ComponentProps;

export default connect(mapStateToProps, mapDispatchToProps)(Component);
