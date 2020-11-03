import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as signVerifyActions from '@wallet-actions/signVerifyActions';
import { AppState, Dispatch } from '@suite-types';
import SignVerify from './index';

const mapStateToProps = (state: AppState) => ({
    selectedAccount: state.wallet.selectedAccount,
    signVerify: state.wallet.signVerify,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    signVerifyActions: bindActionCreators(signVerifyActions, dispatch),
});

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;

export default connect(mapStateToProps, mapDispatchToProps)(SignVerify);
