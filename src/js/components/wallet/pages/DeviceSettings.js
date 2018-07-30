/* @flow */


import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

export const DeviceSettings = () => (
    <section className="device-settings">
        <div className="row">
            <h2>Device settings is under construction</h2>
            <p>Please use Bitcoin wallet interface to change your device settings</p>
            <a className="button" href="https://wallet.trezor.io/">Take me to the Bitcoin wallet</a>
        </div>
    </section>
);

export default connect(null, null)(DeviceSettings);
