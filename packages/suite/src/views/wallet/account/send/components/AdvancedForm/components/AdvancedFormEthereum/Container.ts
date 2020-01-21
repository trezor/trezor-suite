import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import * as sendFormActionsEthereum from '@wallet-actions/sendFormSpecific/ethereumActions';

import { AppState, Dispatch } from '@suite-types';
import AdditionalFormEthereum from './index';

const mapStateToProps = (state: AppState) => ({
    selectedAccount: state.wallet.selectedAccount,
    send: state.wallet.send,
    fiat: state.wallet.fiat,
    device: state.suite.device,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    sendFormActions: bindActionCreators(sendFormActions, dispatch),
    sendFormActionsEthereum: bindActionCreators(sendFormActionsEthereum, dispatch),
});

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type Props = StateProps & DispatchProps;

export default connect(mapStateToProps, mapDispatchToProps)(AdditionalFormEthereum);
