import { AppState, Dispatch } from '@suite-types';
import * as sendFormActions from '@wallet-actions/send/sendFormActions';
import * as modalActions from '@suite-actions/modalActions';
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
    sendFormActions: bindActionCreators(sendFormActions, dispatch),
    modalActions: bindActionCreators(modalActions, dispatch),
});

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type Props = StateProps & DispatchProps;

export default connect(mapStateToProps, mapDispatchToProps)(Component);
