import { Provider } from 'react-redux';
import store from '../store';
import GlobalStyle from '../GlobalStyle';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

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
                <Routes>
                    <AppContainer>
                        <Route path="/method/:method" element={<Method />} />
                        <Route path="/" element={<About />} />
                        <Route path="/changelog" element={<Changelog />} />
                        <Route path="/events" element={<Events />} />
                        <Route path="/settings" element={<Settings />} />
                    </AppContainer>
                </Routes>
            </Router>
        </Provider>
    </>
);

export default App;
