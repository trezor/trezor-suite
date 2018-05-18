/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

const Bootloader = () => {
    return (
        <section className="acquire">
            <h3>Bootloader mode</h3>
        </section>
    );
}

export default connect(null, null)(Bootloader);
