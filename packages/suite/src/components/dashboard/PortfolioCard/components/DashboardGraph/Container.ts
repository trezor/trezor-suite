import { connect } from 'react-redux';
import { AppState } from '@suite-types';
import { Account } from '@wallet-types';
import Component from './index';

const mapStateToProps = (state: AppState) => ({
    localCurrency: state.wallet.settings.localCurrency,
});

interface OwnProps {
    discoveryInProgress: boolean;
    accounts: Account[];
}
export type Props = ReturnType<typeof mapStateToProps> & OwnProps;

export default connect(mapStateToProps)(Component);
