import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as modalActions from '@suite-actions/modalActions';
import { AppState, Dispatch } from '@suite-types';
import { WalletAccountTransaction } from '@wallet-reducers/transactionReducer';
import Component from './index';

const mapStateToProps = (_state: AppState) => ({});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    openModal: bindActionCreators(modalActions.openModal, dispatch),
});

interface OwnProps extends React.HTMLProps<HTMLDivElement> {
    explorerUrl: string;
    transaction: WalletAccountTransaction;
}

export type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> &
    OwnProps;

export default connect(mapStateToProps, mapDispatchToProps)(Component);
