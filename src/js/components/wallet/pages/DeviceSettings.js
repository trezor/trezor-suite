import React from 'react';
import { H2 } from '~/js/components/common/Heading';
import { connect } from 'react-redux';

export const DeviceSettings = () => (
    <section className="device-settings">
        <div className="row">
            <H2>Device settings is under construction</H2>
            <p>Please use Bitcoin wallet interface to change your device settings</p>
            <a className="button" href="https://wallet.trezor.io/">Take me to the Bitcoin wallet</a>
        </div>
    </section>
);

export default connect(null, null)(DeviceSettings);
