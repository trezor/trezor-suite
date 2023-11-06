import { Provider } from 'react-redux';
import store from '../store';
import GlobalStyle from '../GlobalStyle';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';

import AppContainer from '../containers/AppContainer';
import Method from '../components/Method';
import { About } from '../components/PageAbout';
import { Events } from '../components/PageEvents';
import { Changelog } from '../components/PageChangelog';
import { Settings } from '../components/Settings';

const App = () => (
    <>
        <GlobalStyle />
        <Provider store={store}>
            <Router>
                <Switch>
                    <AppContainer>
                        <Route path="/method/:method" component={Method} />
                        <Route exact path="/" component={About} />
                        <Route exact path="/changelog" component={Changelog} />
                        <Route exact path="/events" component={Events} />
                        <Route exact path="/settings" component={Settings} />
                    </AppContainer>
                </Switch>
            </Router>
        </Provider>
    </>
);

export default App;
