import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as graphActions from '@wallet-actions/graphActions';
import { AppState, Dispatch } from '@suite-types';
import { Account } from '@wallet-types';
import Summary from './index';

const mapStateToProps = (state: AppState) => ({
    selectedAccount: state.wallet.selectedAccount,
    graph: state.wallet.graph,
    accounts: state.wallet.accounts,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    updateGraphData: bindActionCreators(graphActions.updateGraphData, dispatch),
    setSelectedRange: bindActionCreators(graphActions.setSelectedRange, dispatch),
});

type OwnProps = {
    account: Account;
};

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type Props = StateProps & DispatchProps & OwnProps;

export default connect(mapStateToProps, mapDispatchToProps)(Summary);
