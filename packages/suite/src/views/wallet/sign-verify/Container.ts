import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as notificationActions from '@suite-actions/notificationActions';
import SignVerify from './index';
import { AppState, Dispatch } from '@suite-types';

const mapStateToProps = (state: AppState) => ({
    selectedAccount: state.wallet.selectedAccount,
    suite: state.suite,
    signVerify: state.wallet.signVerify,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    notificationActions: bindActionCreators(notificationActions, dispatch),
});

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;

export interface ChildProps {
    account: NonNullable<StateProps['selectedAccount']['account']>;
    notificationActions: DispatchProps['notificationActions'];
    isLocked: () => boolean;
    device: StateProps['suite']['device'];
}

export default connect(mapStateToProps, mapDispatchToProps)(SignVerify);
