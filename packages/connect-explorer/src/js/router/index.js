/* @flow */
'use strict';

import React from 'react';
import { Route } from 'react-router-dom';
import { AppContainer, MethodsContainer } from '../containers';
import { GetPublicKey, ComposeTransaction } from '../components/methods';

const methodsContainer = (component) => {
    return (props) => ( <MethodsContainer component={ component }/> );
}

export default (
    <AppContainer>
        <Route exact path="/" render={ methodsContainer(ComposeTransaction) } />
        <Route exact path="/xpub" render={ methodsContainer(GetPublicKey) } />
    </AppContainer>
);