/* @flow */

import React from 'react';
import { H2 } from '~/js/components/common/Heading';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

const Bootloader = () => (
    <section className="device-settings">
        <div className="row">
            <H2>Your device is in firmware update mode</H2>
            <p>Please re-connect it</p>
        </div>
    </section>
);

export default connect(null, null)(Bootloader);
