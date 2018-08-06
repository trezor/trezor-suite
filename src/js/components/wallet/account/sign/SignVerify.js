/* @flow */


import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

const SignVerify = () => (
    <section className="signverify">
        <div className="sign">
            <h2>Sign message</h2>
            <label>Message</label>
            <textarea rows="4" maxLength="255" />
            <label>Address</label>
            <input type="text" />
            <label>Signature</label>
            <textarea rows="4" maxLength="255" readOnly="readonly" />
        </div>
        <div className="verify">
            <h2>Verify message</h2>
            <label>Message</label>
            <textarea rows="4" maxLength="255" />
            <label>Address</label>
            <input type="text" />
            <label>Signature</label>
            <textarea rows="4" maxLength="255" />
        </div>
    </section>
);

export default connect(null, null)(SignVerify);