import React from 'react';
import { H2 } from '~/js/components/common/Heading';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

const SignVerify = () => (
    <section className="signverify">
        <div className="sign">
            <H2>Sign message</H2>
            <label>Message</label>
            <textarea rows="4" maxLength="255" />
            <label>Address</label>
            <input type="text" />
            <label>Signature</label>
            <textarea rows="4" maxLength="255" readOnly="readonly" />
        </div>
        <div className="verify">
            <H2>Verify message</H2>
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