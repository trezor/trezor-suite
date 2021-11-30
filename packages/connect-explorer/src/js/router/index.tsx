import React from 'react';
import { Provider } from 'react-redux';
import store from '../store';
import GlobalStyle from '../GlobalStyle';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';

import AppContainer from '../containers/AppContainer';
import About from '../components/About';
import Method from '../components/Method';

const App = () => (
    <>
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
    </>
);

export default App;
