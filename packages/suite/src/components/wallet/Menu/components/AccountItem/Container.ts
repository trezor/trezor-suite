import { connect } from 'react-redux';
import { Dispatch, AppState } from '@suite-types';
import { Account } from '@wallet-types';
import AccountItem from './index';

const mapStateToProps = (state: AppState) => ({
    localCurrency: state.wallet.settings.localCurrency,
    discreetMode: state.wallet.settings.discreetMode,
    fiat: state.wallet.fiat,
});

const mapDispatchToProps = (_dispatch: Dispatch) => ({});

interface OwnProps {
    account: Account;
    selected: boolean;
}

export type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> &
    OwnProps;

export default connect(mapStateToProps, mapDispatchToProps)(AccountItem);
