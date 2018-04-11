/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Route, withRouter } from 'react-router-dom';

import Header from '../common/Header';
import Footer from '../common/Footer';
import AccountTabs from './account/AccountTabs';
import AsideContainer from './aside';
import ModalContainer from '../modal';
import Notifications from '../common/Notification';
import Log from '../common/Log';

const Content = (props) => {
    return (
        <article>
            <nav>
                <Route path="/device/:device/network/:network/address/:address" component={ AccountTabs } />
            </nav>
            <Notifications />
            <Log />
            { props.children }
            <Footer />
        </article>
    );
}

const Wallet = (props: any): any => {
    return (
        <div className="app">
            <Header />
            <main>
                <AsideContainer />
                <Content>
                    { props.children }
                </Content>
            </main>
            <ModalContainer />
        </div>
    );
}

const mapStateToProps = (state, own) => {
    return { 
        
    };
}

const mapDispatchToProps = (dispatch) => {
    return { };
}

export default withRouter(
    connect(mapStateToProps, mapDispatchToProps)(Wallet)
);
