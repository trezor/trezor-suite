import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as sendFormActions from '@wallet-actions/send/sendFormActions';

import { AppState, Dispatch } from '@suite-types';
import Component from './index';

const mapStateToProps = (state: AppState) => ({
    send: state.wallet.send,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    sendFormActions: bindActionCreators(sendFormActions, dispatch),
});

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type Props = StateProps & DispatchProps;

export default connect(mapStateToProps, mapDispatchToProps)(Component);
