import { connect } from 'react-redux';
import { AppState, Dispatch } from '@suite-types';
import Summary from './index';

const mapStateToProps = (state: AppState) => ({
    wallet: state.wallet,
    suite: state.suite,
    fiat: state.wallet.fiat,
    router: state.router,
});

const mapDispatchToProps = () => ({});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Summary);
