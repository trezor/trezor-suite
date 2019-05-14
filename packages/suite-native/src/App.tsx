import React from 'react';
import { Provider } from 'react-redux';
import { initStore } from './reducers/store';
import RouterHandler from './support/RouterHandler';

const TrezorSuite = () => {
    const store = initStore();
    return (
        <Provider store={store}>
            <RouterHandler store={store} />
        </Provider>
    );
};

export default TrezorSuite;
