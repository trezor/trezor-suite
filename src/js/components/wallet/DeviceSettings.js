/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

export const DeviceSettings = (props: any): any => {
    return (
        <section className="settings">
            Device settings
        </section>
    );
}

const mapStateToProps = (state, own) => {
    return {
    
    };
}

const mapDispatchToProps = (dispatch) => {
    return { 
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(DeviceSettings);
