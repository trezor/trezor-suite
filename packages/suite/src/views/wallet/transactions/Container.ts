import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { injectIntl } from 'react-intl';
import * as transactionActions from '@wallet-actions/transactionActions';
import * as routerActions from '@suite-actions/routerActions';
import * as graphActions from '@wallet-actions/graphActions';
import { AppState, Dispatch } from '@suite-types';
import SendIndex from './index';

const mapStateToProps = (state: AppState) => ({
    selectedAccount: state.wallet.selectedAccount,
    transactions: state.wallet.transactions,
    graph: state.wallet.graph,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    fetchTransactions: bindActionCreators(transactionActions.fetchTransactions, dispatch),
    updateGraphData: bindActionCreators(graphActions.updateGraphData, dispatch),
    goto: bindActionCreators(routerActions.goto, dispatch),
});

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type Props = StateProps & DispatchProps;

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(SendIndex));
