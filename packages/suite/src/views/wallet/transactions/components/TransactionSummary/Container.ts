import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as graphActions from '@wallet-actions/graphActions';
import { AppState, Dispatch } from '@suite-types';
import { Account } from '@wallet-types';
import Summary from './index';

const mapStateToProps = (state: AppState) => ({
    graph: state.wallet.graph,
    localCurrency: state.wallet.settings.localCurrency,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            updateGraphData: graphActions.updateGraphData,
            setSelectedRange: graphActions.setSelectedRange,
            getGraphDataForInterval: graphActions.getGraphDataForInterval,
        },
        dispatch,
    );

type OwnProps = {
    account: Account;
};

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type Props = StateProps & DispatchProps & OwnProps;

export default connect(mapStateToProps, mapDispatchToProps)(Summary);
