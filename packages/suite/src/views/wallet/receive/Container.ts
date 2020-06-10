import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { injectIntl } from 'react-intl';
import * as notificationActions from '@suite-actions/notificationActions';
import * as receiveActions from '@wallet-actions/receiveActions';

import { AppState, Dispatch } from '@suite-types';
import SendIndex from './index';

const mapStateToProps = (state: AppState) => ({
    selectedAccount: state.wallet.selectedAccount,
    device: state.suite.device,
    receive: state.wallet.receive,
    modal: state.modal,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            showAddress: receiveActions.showAddress,
            addToast: notificationActions.addToast,
        },
        dispatch,
    );

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type Props = StateProps & DispatchProps;

export interface ChildProps {
    account: NonNullable<Props['selectedAccount']['account']>;
    addresses: Props['receive'];
    showAddress: Props['showAddress'];
    addToast: Props['addToast'];
    disabled: boolean;
    locked: boolean;
}

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(SendIndex));
