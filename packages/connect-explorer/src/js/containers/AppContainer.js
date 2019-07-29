/* @flow */
'use strict';

import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import TrezorConnect from 'trezor-connect';

import Devices from './DevicesContainer';
import Modal from './ModalContainer';

import Header from '../components/Header';
import Main from '../components/Main';

export default class AppContainer extends Component {
    render() {
        return (
            <div className="app-container">
                <Header />
                <Devices />
                <Main>
                    { this.props.children }
                </Main>
                <Modal />
            </div>
        );
    }
}