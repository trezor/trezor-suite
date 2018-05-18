/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Notification } from '~/js/components/common/Notification';
import * as TrezorConnectActions from '~/js/actions/TrezorConnectActions';

import type { State, Dispatch } from '~/js/flowtype';
type Props = {
    connect: $ElementType<State, 'connect'>,
    acquireDevice: typeof TrezorConnectActions.acquire
}

const Acquire = (props: Props) => {

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
            />
        </section>
    );
}

export default connect( 
    (state: State) => {
        return {
            log: state.log
        };
    },
    (dispatch: Dispatch) => {
        return { 
            acquireDevice: bindActionCreators(TrezorConnectActions.acquire, dispatch),
        };
    }
)(Acquire);
