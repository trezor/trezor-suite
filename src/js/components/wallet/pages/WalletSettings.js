/* @flow */


import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

export const WalletSettings = () => (
    <section className="settings">
            Wallet settings
    </section>
);

export default connect(null, null)(WalletSettings);
