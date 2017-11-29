/* @flow */
'use strict';

import React, { Component } from 'react';

export default class Main extends Component {
    render() {
        return (
            <main>
                <section className="methods">
                    <ul className="accounts">
                    </ul>
                </section>
                <section className="method-content">
                    { this.props.children }
                </section>
            </main>
        );
    }
}
