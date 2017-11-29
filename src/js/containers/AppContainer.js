/* @flow */
'use strict';

import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import TrezorConnect from 'trezor-connect';

import Devices from './DevicesContainer';
import Modal from './ModalContainer';

import Header from '../components/Header';
import Main from '../components/Main';
import Footer from '../components/Footer';

export default class AppContainer extends Component {
    render() {
        return (
            <div className="app-container">
                <Header />
                <Devices />
                <Main>
                    { this.props.children }
                    {/* <Link to="/">Init</Link>
                    <Link to="/about">about</Link> */}
                </Main>
                <Footer />
                <Modal />
            </div>
        );
    }
}