/* @flow */
'use strict';

import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import TrezorConnect from 'trezor-connect';

import Devices from './DevicesContainer';
import Modal from './ModalContainer';

import Header from '../components/Header';
import AddressMenuContainer from './AddressMenuContainer';
import Footer from '../components/Footer';

export default class AppContainer extends Component {
    render() {
        return (
            <div className="app-container">
                <Header />
                <Devices />
                <main>
                    <AddressMenuContainer />
                    { this.props.children }
                </main>
                <Footer />
                <Modal />
            </div>
        );
    }
}