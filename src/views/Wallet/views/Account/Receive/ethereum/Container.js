/* @flow */
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import type { IntlShape } from 'react-intl';

import * as ReceiveActions from 'actions/ReceiveActions';
import type { State, Dispatch } from 'flowtype';
import Receive from './index';

type OwnProps = {|
    intl: IntlShape,
|};

type StateProps = {|
    selectedAccount: $ElementType<State, 'selectedAccount'>,
    receive: $ElementType<State, 'receive'>,
    modal: $ElementType<State, 'modal'>,
    wallet: $ElementType<State, 'wallet'>,
|};

type DispatchProps = {|
    showAddress: typeof ReceiveActions.showAddress,
|};

export type Props = {| ...OwnProps, ...StateProps, ...DispatchProps |};

const mapStateToProps = (state: State): StateProps => ({
    selectedAccount: state.selectedAccount,
    receive: state.receive,
    modal: state.modal,
    wallet: state.wallet,
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
    showAddress: bindActionCreators(ReceiveActions.showAddress, dispatch),
});

export default connect<Props, OwnProps, StateProps, DispatchProps, State, Dispatch>(
    mapStateToProps,
    mapDispatchToProps
)(injectIntl<Props>(Receive));
