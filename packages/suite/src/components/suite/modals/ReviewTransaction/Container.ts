import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { useForm } from 'react-hook-form';
import { SendContext } from '@wallet-hooks/useSendContext';
import { TokenInfo, PrecomposedTransaction } from 'trezor-connect';
import * as modalActions from '@suite-actions/modalActions';

import { AppState, Dispatch } from '@suite-types';
import Component from './index';

const mapStateToProps = (state: AppState) => ({
    selectedAccount: state.wallet.selectedAccount,
    device: state.suite.device,
    suite: state.suite,
    fiat: state.wallet.fiat,
    settings: state.wallet.settings,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    modalActions: bindActionCreators(modalActions, dispatch),
});

interface ComponentProps {
    transactionInfo: PrecomposedTransaction;
    outputs: SendContext['outputs'];
    token: TokenInfo | null;
    getValues: ReturnType<typeof useForm>['getValues'];
    selectedFee: SendContext['selectedFee'];
    reset: ReturnType<typeof useForm>['reset'];
    setSelectedFee: SendContext['setSelectedFee'];
    showAdvancedForm: SendContext['showAdvancedForm'];
    setToken: SendContext['setToken'];
    updateOutputs: SendContext['updateOutputs'];
    initialSelectedFee: SendContext['initialSelectedFee'];
    defaultValues: SendContext['defaultValues'];
}

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type Props = StateProps & DispatchProps & ComponentProps;

export default connect(mapStateToProps, mapDispatchToProps)(Component);
