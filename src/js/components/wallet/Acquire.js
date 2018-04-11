/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Notification } from '../common/Notification';
import * as TrezorConnectActions from '../../actions/TrezorConnectActions';

const Acquire = (props: any): any => {

    const actions = [
        {
            label: 'Acquire device',
            callback: () => {
                props.acquireDevice()
            }
        }
    ];

    return (
        <section className="acquire">
            <Notification 
                title="Device is used in other window"
                message="Do you want to use your device in this window?"
                className="info"
                cancelable={ false }
                actions={ actions }
                close={ () => {} }
            />
        </section>
    );
}

const mapStateToProps = (state, own) => {
    return {
        connect: state.connect
    };
}

const mapDispatchToProps = (dispatch) => {
    return { 
        acquireDevice: bindActionCreators(TrezorConnectActions.acquire, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(Acquire);
