import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
// import { useForm } from 'react-hook-form';
// import { SendContext } from '@wallet-hooks/useSendContext';
// import { TokenInfo, PrecomposedTransaction } from 'trezor-connect';
import * as modalActions from '@suite-actions/modalActions';

import { AppState, Dispatch } from '@suite-types';
import Component from './index';

const mapStateToProps = (state: AppState) => ({
    selectedAccount: state.wallet.selectedAccount,
    fiat: state.wallet.fiat,
    settings: state.wallet.settings,
    send: state.wallet.send,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    modalActions: bindActionCreators(modalActions, dispatch),
});

// type ComponentProps = {
//     transactionInfo: PrecomposedTransaction;
//     outputs: SendContext['outputs'];
//     token: TokenInfo | null;
//     getValues: ReturnType<typeof useForm>['getValues'];
//     selectedFee: SendContext['selectedFee'];
//     send: () => void;
//     onCancel: () => void;
// } & Extract<modalActions.UserContextPayload, { type: 'review-transaction' }>;

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type Props = StateProps & DispatchProps;

export default connect(mapStateToProps, mapDispatchToProps)(Component);
