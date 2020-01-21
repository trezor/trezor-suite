import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as sendFormActionsRipple from '@wallet-actions/sendFormSpecific/rippleActions';

import { AppState, Dispatch } from '@suite-types';
import Component from './index';

const mapStateToProps = (state: AppState) => ({
    send: state.wallet.send,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    sendFormActionsRipple: bindActionCreators(sendFormActionsRipple, dispatch),
});

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type Props = StateProps & DispatchProps;

export default connect(mapStateToProps, mapDispatchToProps)(Component);
