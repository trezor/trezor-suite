/* @flow */
'use strict';

import React, { Component } from 'react';

export default class Footer extends Component {
    render() {
        return (
            <footer>
                <div className="layout-wrapper">
                    <span>© 2017</span>
                    <a href="http://satoshilabs.com">SatoshiLabs</a>
                </div>
            </footer>
        );
    }
}
