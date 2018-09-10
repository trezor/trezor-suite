/* @flow */
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { showAddress } from 'actions/ReceiveActions';
import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import type { State, Dispatch } from 'flowtype';
import type {
    StateProps as BaseStateProps,
    DispatchProps as BaseDispatchProps,
} from 'views/Wallet/components/SelectedAccount';
import Receive from './index';

type OwnProps = { }

type StateProps = BaseStateProps & {
    receive: $ElementType<State, 'receive'>,
    modal: $ElementType<State, 'modal'>,
}

type DispatchProps = BaseDispatchProps & {
    showAddress: typeof showAddress
};

export type Props = StateProps & BaseStateProps & DispatchProps & BaseDispatchProps;

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (state: State): StateProps => ({
    className: 'receive',
    selectedAccount: state.selectedAccount,
    wallet: state.wallet,

    receive: state.receive,
    modal: state.modal,
});

const mapDispatchToProps: MapDispatchToProps<Dispatch, OwnProps, DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
    showAddress: bindActionCreators(showAddress, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Receive);