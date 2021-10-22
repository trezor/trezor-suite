import React from 'react';
import { hot } from 'react-hot-loader';
import { Provider } from 'react-redux';
import store from '../store';
import GlobalStyle from '../GlobalStyle';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';

import AppContainer from '../containers/AppContainer';
import About from '../components/About';
import Method from '../components/Method';

const App = () => (
    <div>
        <GlobalStyle />
        <Provider store={store}>
            <Router>
                <Switch>
                    <AppContainer>
                        <Route path="/method/:method" component={Method} />
                        <Route exact path="/" component={About} />
                    </AppContainer>
                </Switch>
            </Router>
        </Provider>
    </div>
);

export default hot(module)(App);
