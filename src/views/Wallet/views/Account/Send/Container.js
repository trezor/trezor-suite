/* @flow */


import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { reconnect } from 'actions/DiscoveryActions';
import SendFormActions from 'actions/SendFormActions';
import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import type { State, Dispatch } from 'flowtype';
import type { StateProps as BaseStateProps, DispatchProps as BaseDispatchProps } from 'views/Wallet/components/SelectedAccount';
import AccountSend from './index';

type OwnProps = { }

export type StateProps = BaseStateProps & {
    sendForm: $ElementType<State, 'sendForm'>,
    fiat: $ElementType<State, 'fiat'>,
    localStorage: $ElementType<State, 'localStorage'>,
    children?: React.Node;
}

export type DispatchProps = BaseDispatchProps & {
    sendFormActions: typeof SendFormActions,
}

export type Props = StateProps & BaseStateProps & DispatchProps & BaseDispatchProps;

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (state: State): StateProps => ({
    className: 'send-from',
    selectedAccount: state.selectedAccount,
    wallet: state.wallet,
    blockchain: state.blockchain,

    sendForm: state.sendForm,
    fiat: state.fiat,
    localStorage: state.localStorage,
});

const mapDispatchToProps: MapDispatchToProps<Dispatch, OwnProps, DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
    blockchainReconnect: bindActionCreators(reconnect, dispatch),
    sendFormActions: bindActionCreators(SendFormActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(AccountSend);