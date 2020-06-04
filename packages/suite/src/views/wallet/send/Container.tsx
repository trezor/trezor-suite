import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { injectIntl } from 'react-intl';
import * as modalActions from '@suite-actions/modalActions';
import * as sendFormActions from '@wallet-actions/send/sendFormActions';
import * as sendFormActionsBitcoin from '@wallet-actions/send/sendFormBitcoinActions';
import * as sendFormActionsEthereum from '@wallet-actions/send/sendFormEthereumActions';
import * as sendFormActionsRipple from '@wallet-actions/send/sendFormRippleActions';

import { AppState, Dispatch } from '@suite-types';
import Component from './index';

const mapStateToProps = (state: AppState) => ({
    selectedAccount: state.wallet.selectedAccount,
    send: state.wallet.send,
    accounts: state.wallet.accounts,
    fees: state.wallet.fees,
    device: state.suite.device,
    locks: state.suite.locks,
    online: state.suite.online,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    openModal: bindActionCreators(modalActions.openModal, dispatch),
    sendFormActions: bindActionCreators(sendFormActions, dispatch),
    sendFormActionsBitcoin: bindActionCreators(sendFormActionsBitcoin, dispatch),
    sendFormActionsRipple: bindActionCreators(sendFormActionsRipple, dispatch),
    sendFormActionsEthereum: bindActionCreators(sendFormActionsEthereum, dispatch),
});

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type Props = StateProps & DispatchProps;

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(Component));
