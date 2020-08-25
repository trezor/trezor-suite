import { connect } from 'react-redux';
import { AppState } from '@suite-types';
import Component from './index';

const mapStateToProps = (state: AppState) => ({
    accounts: state.wallet.accounts,
});

export type Props = ReturnType<typeof mapStateToProps> & {
    address?: string | null;
    knownOnly?: boolean;
};

export default connect(mapStateToProps)(Component);
