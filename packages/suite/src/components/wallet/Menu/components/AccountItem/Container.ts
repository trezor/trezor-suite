import { connect } from 'react-redux';
import { AppState } from '@suite-types';
import { Account } from '@wallet-types';
import AccountItem from './index';

const mapStateToProps = (state: AppState) => ({
    localCurrency: state.wallet.settings.localCurrency,
    fiat: state.wallet.fiat,
});

// const mapDispatchToProps = (dispatch: Dispatch) => ({
// });

interface OwnProps {
    account: Account;
    hideBalance: boolean;
    selected: boolean;
}

export type StateProps = ReturnType<typeof mapStateToProps>;
// export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type Props = StateProps & OwnProps;

export default connect(mapStateToProps, null)(AccountItem);
