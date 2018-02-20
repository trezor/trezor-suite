/* @flow */
'use strict';

import React from 'react';

const Footer = (props: any): any => {
    return (
        <footer>
            <span>© 2018</span>
            <a href="http://satoshilabs.com" target="_blank" className="satoshi green">SatoshiLabs</a>
            <a href="tos.pdf" target="_blank" className="green">Terms</a>
            <a onClick={ props.showLog } className="green">Show Log</a>
        </footer>
    );
}

export default Footer;
