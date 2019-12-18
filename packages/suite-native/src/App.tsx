import React from 'react';
import { Provider } from 'react-redux';
import 'react-native-gesture-handler'; // https://reactnavigation.org/docs/en/getting-started.html
import './support/global';
import Preloader from './support/Preloader';
import RouterHandler from './support/RouterHandler';
import { initStore } from './reducers/store';

const TrezorSuite = () => {
    const store = initStore();
    return (
        <Provider store={store}>
            <Preloader isStatic={false}>
                <RouterHandler />
            </Preloader>
        </Provider>
    );
};

export default TrezorSuite;
