/* @flow */
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import { reconnect } from 'actions/DiscoveryActions';
import * as TokenActions from 'actions/TokenActions';

import type { State, Dispatch } from 'flowtype';
import type { StateProps as BaseStateProps, DispatchProps as BaseDispatchProps } from 'views/Wallet/components/SelectedAccount';
import Summary from './index';

type OwnProps = { }

type StateProps = BaseStateProps & {
    tokens: $ElementType<State, 'tokens'>,
    summary: $ElementType<State, 'summary'>,
    fiat: $ElementType<State, 'fiat'>,
    localStorage: $ElementType<State, 'localStorage'>,
};

type DispatchProps = BaseDispatchProps & {
    addToken: typeof TokenActions.add,
    loadTokens: typeof TokenActions.load,
    removeToken: typeof TokenActions.remove,
}

export type Props = StateProps & BaseStateProps & DispatchProps & BaseDispatchProps;

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (state: State): StateProps => ({
    className: 'summary',
    selectedAccount: state.selectedAccount,
    wallet: state.wallet,
    blockchain: state.blockchain,

    tokens: state.tokens,
    summary: state.summary,
    fiat: state.fiat,
    localStorage: state.localStorage,
});

const mapDispatchToProps: MapDispatchToProps<Dispatch, OwnProps, DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
    blockchainReconnect: bindActionCreators(reconnect, dispatch),
    addToken: bindActionCreators(TokenActions.add, dispatch),
    loadTokens: bindActionCreators(TokenActions.load, dispatch),
    removeToken: bindActionCreators(TokenActions.remove, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Summary);