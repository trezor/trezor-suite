/* @flow */


import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import Summary from './Summary';
import * as SummaryActions from '~/js/actions/SummaryActions';
import * as TokenActions from '~/js/actions/TokenActions';

import type { State, Dispatch } from '~/flowtype';
import type { StateProps as BaseStateProps, DispatchProps as BaseDispatchProps } from '../SelectedAccount';

type OwnProps = { }

type StateProps = BaseStateProps & {
    tokens: $ElementType<State, 'tokens'>,
    summary: $ElementType<State, 'summary'>,
    fiat: $ElementType<State, 'fiat'>,
    localStorage: $ElementType<State, 'localStorage'>,
};

type DispatchProps = BaseDispatchProps & {
    onDetailsToggle: typeof SummaryActions.onDetailsToggle,
    addToken: typeof TokenActions.add,
    loadTokens: typeof TokenActions.load,
    removeToken: typeof TokenActions.remove,
}

export type Props = StateProps & BaseStateProps & DispatchProps & BaseDispatchProps;

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (state: State, own: OwnProps): StateProps => ({
    className: 'summary',
    selectedAccount: state.selectedAccount,
    wallet: state.wallet,

    tokens: state.tokens,
    summary: state.summary,
    fiat: state.fiat,
    localStorage: state.localStorage,
});

const mapDispatchToProps: MapDispatchToProps<Dispatch, OwnProps, DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
    onDetailsToggle: bindActionCreators(SummaryActions.onDetailsToggle, dispatch),
    addToken: bindActionCreators(TokenActions.add, dispatch),
    loadTokens: bindActionCreators(TokenActions.load, dispatch),
    removeToken: bindActionCreators(TokenActions.remove, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Summary);