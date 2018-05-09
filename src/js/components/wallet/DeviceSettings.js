/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

export const DeviceSettings = () => {
    return (
        <section className="device-settings">
            <h2>Device settings</h2>
            <div className="row">
                <h2>Device settings is under construction</h2>
                <p>Please use old wallet to edit your device settings</p>
                <a className="button" href="https://wallet.trezor.io/">Take me to the old wallet</a>
            </div>
        </section>
    );
}

export default connect(null, null)(DeviceSettings);
