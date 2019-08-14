import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as TokenActions from '@wallet-actions/tokenActions';

import { AppState, Dispatch } from '@suite-types';
import Summary from './index';

const mapStateToProps = (state: AppState) => ({
    wallet: state.wallet,
    fiat: state.wallet.fiat,
    router: state.router,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    addToken: bindActionCreators(TokenActions.add, dispatch),
    loadTokens: bindActionCreators(TokenActions.load, dispatch),
    removeToken: bindActionCreators(TokenActions.remove, dispatch),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Summary);
