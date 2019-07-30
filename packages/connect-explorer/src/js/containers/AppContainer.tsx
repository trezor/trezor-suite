import React from 'react';

import Devices from './DevicesContainer';
import Modal from './ModalContainer';

import Header from '../components/Header';
import Main from '../components/Main';

export const AppContainer: React.FC = props => {
    return (
        <div className="app-container">
            <Header />
            <Devices />
            <Main>{props.children}</Main>
            <Modal />
        </div>
    );
};
