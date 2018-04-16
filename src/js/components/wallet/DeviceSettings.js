/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

export const DeviceSettings = () => {
    return (
        <section className="settings">
            Device settings
        </section>
    );
}

export default connect(null, null)(DeviceSettings);
