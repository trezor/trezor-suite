/* @flow */
'use strict';

import React from 'react';
import { Notification } from '../common/Notification';

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
                cancelable={false}
                actions={actions}
                close={ () => {} }
            />
            {/* <div className="warning">
                <div>
                    <h2></h2>
                    <p></p>
                </div>
                <button onClick={ event => props.acquireDevice() }>Acquire device</button>
            </div> */}
        </section>
    );
}

export default Acquire;
