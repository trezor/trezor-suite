/* @flow */
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';

import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import * as TokenActions from 'actions/TokenActions';

import type { State, Dispatch } from 'flowtype';
import Summary from './index';

type OwnProps = {
    intl: any,
}

type StateProps = {
    selectedAccount: $ElementType<State, 'selectedAccount'>,
    summary: $ElementType<State, 'summary'>,
    wallet: $ElementType<State, 'wallet'>,
    tokens: $ElementType<State, 'tokens'>,
    fiat: $ElementType<State, 'fiat'>,
    localStorage: $ElementType<State, 'localStorage'>,
};

type DispatchProps = {
    addToken: typeof TokenActions.add,
    loadTokens: typeof TokenActions.load,
    removeToken: typeof TokenActions.remove,
}

export type Props = OwnProps & StateProps & DispatchProps;

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (state: State): StateProps => ({
    selectedAccount: state.selectedAccount,
    summary: state.summary,
    wallet: state.wallet,
    tokens: state.tokens,
    fiat: state.fiat,
    localStorage: state.localStorage,
});

const mapDispatchToProps: MapDispatchToProps<Dispatch, OwnProps, DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
    addToken: bindActionCreators(TokenActions.add, dispatch),
    loadTokens: bindActionCreators(TokenActions.load, dispatch),
    removeToken: bindActionCreators(TokenActions.remove, dispatch),
});

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(Summary));