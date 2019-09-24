import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import * as sendFormActionsXrp from '@wallet-actions/sendFormSpecific/xrpActions';

import { AppState, Dispatch } from '@suite-types';
import AdditionalFormXrp from './index';

const mapStateToProps = (state: AppState) => ({
    selectedAccount: state.wallet.selectedAccount,
    send: state.wallet.send,
    fiat: state.wallet.fiat,
    device: state.suite.device,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    sendFormActions: bindActionCreators(sendFormActions, dispatch),
    sendFormActionsXrp: bindActionCreators(sendFormActionsXrp, dispatch),
});

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type Props = StateProps & DispatchProps;

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(AdditionalFormXrp);
