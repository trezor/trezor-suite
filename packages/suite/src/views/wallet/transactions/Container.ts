import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as transactionActions from '@wallet-actions/transactionActions';
import * as routerActions from '@suite-actions/routerActions';
import { AppState, Dispatch } from '@suite-types';
import TransactionsIndex from './index';

const mapStateToProps = (state: AppState) => ({
    selectedAccount: state.wallet.selectedAccount,
    transactions: state.wallet.transactions,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            fetchTransactions: transactionActions.fetchTransactions,
            goto: routerActions.goto,
        },
        dispatch,
    );

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type Props = StateProps & DispatchProps;

export default connect(mapStateToProps, mapDispatchToProps)(TransactionsIndex);
