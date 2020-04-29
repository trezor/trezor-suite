import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as modalActions from '@suite-actions/modalActions';
import { Output } from '@wallet-types/sendForm';
import * as sendFormActions from '@wallet-actions/send/sendFormActions';

import { AppState, Dispatch } from '@suite-types';
import Component from './index';

const mapStateToProps = (state: AppState) => ({
    account: state.wallet.selectedAccount.account,
    send: state.wallet.send,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    openModal: bindActionCreators(modalActions.openModal, dispatch),
    sendFormActions: bindActionCreators(sendFormActions, dispatch),
});

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;

interface MergedProps extends StateProps {
    output: Output;
}

export type Props = MergedProps & DispatchProps;

export default connect(mapStateToProps, mapDispatchToProps)(Component);
