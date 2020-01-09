import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as routerActions from '@suite-actions/routerActions';

import { AppState, Dispatch } from '@suite-types';
import Component from './index';

const mapStateToProps = (state: AppState) => ({
    router: state.router,
    selectedAccount: state.wallet.selectedAccount,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
});

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type Props = StateProps & DispatchProps;

export default connect(mapStateToProps, mapDispatchToProps)(Component);
