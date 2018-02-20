/* @flow */
'use strict';

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import Header from '../components/common/Header';
import AsideContainer from './AsideContainer';
import ContentContainer from './ContentContainer';
import ModalContainer from '../components/modal/ModalContainer';

const Wallet = (props: any): any => {
    return (
        <div className="app">
            <Header />
            <main>
                <AsideContainer />
                <ContentContainer>
                    { props.children }
                </ContentContainer>
            </main>
            <ModalContainer />
        </div>
    );
}

function mapStateToProps(state, own) {
    return { 
        
    };
}

function mapDispatchToProps(dispatch) {
    return { };
}

export default withRouter(
    connect(mapStateToProps, mapDispatchToProps)(Wallet)
);
