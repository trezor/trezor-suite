import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as modalActions from '@suite-actions/modalActions';
import { AppState, Dispatch } from '@suite-types';
import { WalletAccountTransaction } from '@wallet-types';
import Component from './index';

const mapStateToProps = (_state: AppState) => ({});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            openModal: modalActions.openModal,
        },
        dispatch,
    );

interface OwnProps extends React.HTMLAttributes<HTMLDivElement> {
    transaction: WalletAccountTransaction;
    isPending: boolean;
}

export type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> &
    OwnProps;

export default connect(mapStateToProps, mapDispatchToProps)(Component);