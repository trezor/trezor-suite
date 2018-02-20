/* @flow */
'use strict';

import React from 'react';

export default (props: any): any => {
    return (
        <section className="signverify">
            <div className="sign">
                <h2>Sign message</h2>
                <label>Message</label>
                <textarea rows="4" maxLength="255"></textarea>
                <label>Address</label>
                <input type="text" />
                <label>Signature</label>
                <textarea rows="4" maxLength="255" readOnly="readonly"></textarea>
            </div>
            <div className="verify">
                <h2>Verify message</h2>
                <label>Message</label>
                <textarea rows="4" maxLength="255"></textarea>
                <label>Address</label>
                <input type="text" />
                <label>Signature</label>
                <textarea rows="4" maxLength="255"></textarea>
            </div>
        </section>
    );
}
