/* @flow */
'use strict';

import React from 'react';
import { Route } from 'react-router-dom';
import { AppContainer, MethodsContainer } from '../containers';
import { 
    GetPublicKey,
    NEMSignTx,
    ComposeTransaction 
} from '../components/methods';

const methodsContainer = (component) => {
    return (props) => ( <MethodsContainer component={ component }/> );
}

export default (
    <AppContainer>
        <Route exact path="/" render={ methodsContainer(GetPublicKey) } />
        <Route exact path="/nem-signtx" render={ methodsContainer(NEMSignTx) } />
        <Route exact path="/cipherkv" render={ methodsContainer(GetPublicKey) } />
        <Route exact path="/compose" render={ methodsContainer(GetPublicKey) } />
    </AppContainer>
);