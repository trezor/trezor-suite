import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as sendFormActionsBitcoin from '@wallet-actions/send/sendFormBitcoinActions';

import { AppState, Dispatch } from '@suite-types';
import Component from './index';

const mapStateToProps = (state: AppState) => ({
    selectedAccount: state.wallet.selectedAccount,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    sendFormActionsBitcoin: bindActionCreators(sendFormActionsBitcoin, dispatch),
});

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type Props = StateProps & DispatchProps;

export default connect(mapStateToProps, mapDispatchToProps)(Component);
