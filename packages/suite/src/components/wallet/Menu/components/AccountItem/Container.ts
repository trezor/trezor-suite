import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Dispatch, AppState } from '@suite-types';
import { Account } from '@wallet-types';
import * as routerActions from '@suite-actions/routerActions';
import AccountItem from './index';

const mapStateToProps = (state: AppState) => ({
    router: state.router,
    localCurrency: state.wallet.settings.localCurrency,
    discreetMode: state.wallet.settings.discreetMode,
    fiat: state.wallet.fiat,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
});

interface OwnProps {
    account: Account;
    selected: boolean;
    forwardedRef?: (ref: HTMLDivElement | null) => void | null;
}

export type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> &
    OwnProps;

export default connect(mapStateToProps, mapDispatchToProps)(AccountItem);
