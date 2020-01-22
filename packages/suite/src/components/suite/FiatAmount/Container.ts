import React from 'react';
import Component from './index';
import { AppState } from '@suite-types';
import { Account } from '@wallet-types';
import { connect } from 'react-redux';

const mapStateToProps = (state: AppState) => ({
    fiat: state.wallet.fiat,
    settings: state.wallet.settings,
});

type OwnProps = {
    amount: string;
    symbol: Account['symbol'];
    fiatCurrency: string;
};

export type Props = ReturnType<typeof mapStateToProps> & OwnProps;

export default connect(mapStateToProps, null)(Component);
