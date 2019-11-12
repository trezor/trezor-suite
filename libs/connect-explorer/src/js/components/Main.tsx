import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';
import Menu from './Menu';

const navLink = (url: string, label: string) => {
    return (
        <NavLink to={url} exact activeClassName="selected">
            {label}
        </NavLink>
    );
};

const Main = props => (
    <main>
        <Menu />
        {props.children}
    </main>
);

export default Main;
