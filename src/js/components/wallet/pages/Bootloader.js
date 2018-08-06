/* @flow */


import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

const Bootloader = () => (
    <section className="device-settings">
        <div className="row">
            <h2>Your device is in firmware update mode</h2>
            <p>Please re-connect it</p>
        </div>
    </section>
);

export default connect(null, null)(Bootloader);
