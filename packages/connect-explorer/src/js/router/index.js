/* @flow */

import React from 'react';
import { hot } from 'react-hot-loader';
import { Route, Switch } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import store, { history } from '../store';

import AppContainer from '../containers/AppContainer';
import About from '../components/About';
import Method from '../components/Method';

const App = () => (
    <Provider store={ store }>
        <ConnectedRouter history={ history }>
            <Switch>
                <AppContainer>
                    <Route exact path="/" component={ About } />
                    <Route exact path="/method/:method" component={ Method } />
                </AppContainer>
            </Switch>
        </ConnectedRouter>
    </Provider>
);

export default hot(module)(App);