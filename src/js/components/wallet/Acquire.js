/* @flow */
'use strict';

import React from 'react';

const Acquire = (props: any): any => {
    return (
        <section className="acquire">
            <div className="warning">
                <div>
                    <h2>Device is used in other window</h2>
                    <p>Do you want to use your device in this window?</p>
                </div>
                <button onClick={ event => props.acquireDevice() }>Acquire device</button>
            </div>
        </section>
    );
}

export default Acquire;
