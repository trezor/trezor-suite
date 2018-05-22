/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

const Initialize = () => {
    return (
        <section className="acquire">
            <h3>Device not initialized</h3>
        </section>
    );
}

export default connect(null, null)(Initialize);
