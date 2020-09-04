import { connect } from 'react-redux';
import { AppState } from '@suite-types';
import { UserContextPayload } from '@suite-actions/modalActions';
import Component from './index';

const mapStateToProps = (state: AppState) => ({
    selectedAccount: state.wallet.selectedAccount,
    fiat: state.wallet.fiat,
    settings: state.wallet.settings,
    send: state.wallet.send,
});

// Since this modal is opened either in Device or User context
// those contexts needs to be distinguished by `type` prop
type DeferredProps =
    | Extract<UserContextPayload, { type: 'review-transaction' }>
    | { type: 'sign-transaction'; decision?: undefined };
export type Props = ReturnType<typeof mapStateToProps> & DeferredProps;

export default connect(mapStateToProps)(Component);
