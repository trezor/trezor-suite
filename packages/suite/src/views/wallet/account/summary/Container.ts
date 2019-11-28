import { connect } from 'react-redux';
import { AppState } from '@suite-types';
import Summary from './index';

const mapStateToProps = (state: AppState) => ({
    wallet: state.wallet,
    suite: state.suite,
    fiat: state.wallet.fiat,
    router: state.router,
});

const mapDispatchToProps = () => ({});

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default connect(mapStateToProps, mapDispatchToProps)(Summary);
