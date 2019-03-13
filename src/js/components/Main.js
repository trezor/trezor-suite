/* @flow */
'use strict';

import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';
import Menu from './Menu';

const navLink = (url: string, label: string) => {

    return (
        <NavLink
            to={ url }
            exact
            activeClassName="selected">
            { label }
        </NavLink>
    );
}

export default class Main extends Component {
    render() {
        return (
            <main>
                <Menu />
                { this.props.children }
            </main>
        );
    }
}
