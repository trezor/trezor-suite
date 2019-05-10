import React from 'react';
import { Provider } from 'react-redux';
import { initStore } from './reducers/store';
import Router from './RouterHandler';

const TrezorSuite = () => {
    const store = initStore();
    return (
        <Provider store={store}>
            <Router store={store} />
        </Provider>
    );
};

export default TrezorSuite;
