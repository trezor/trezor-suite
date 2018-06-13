/* @flow */
'use strict';

import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';
import store, { history } from '../store';

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
    <Provider store={ store }>
        <ConnectedRouter history={ history }>
            <Switch>
                <AppContainer>
                    <Route exact path="/" render={ methodsContainer(GetPublicKey) } />
                    <Route exact path="/nem-signtx" render={ methodsContainer(NEMSignTx) } />
                </AppContainer>
            </Switch>
        </ConnectedRouter>
    </Provider>
);