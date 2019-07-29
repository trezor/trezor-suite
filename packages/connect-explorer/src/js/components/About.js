/* @flow */
import React from 'react';

export default () => {
    return (
        <section className="method-content">
            <p><strong>TrezorConnect Explorer</strong> is a tool that can be used to test all the TrezorConnect methods.</p>
            <p>In the menu you can find a list of coins; when you choose a coin you can find the corresponding methods to test (e.g., within Bitcoin all bitcoin-like coins such as Litecoin can be tested, see also https://github.com/trezor/trezor-common/tree/master/defs).</p>
            <p>For methods not related to a coin, look under the <strong>"Other methods"</strong> tab.</p>
            <p>For methods related to the Trezor device, look under the <strong>"Device management"</strong> tab.</p>
            <p>Each method contains subsections as well as examples of how to use them.</p>
        </section>
    );
}
