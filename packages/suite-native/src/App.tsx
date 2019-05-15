import React from 'react';
import { Provider } from 'react-redux';
import './support/global';
import RouterHandler from './support/RouterHandler';

import { initStore } from './reducers/store';
import Preloader from '@suite/components/Preloader';

const TrezorSuite = () => {
    const store = initStore();
    return (
        <Provider store={store}>
            <Preloader>
                <RouterHandler />
            </Preloader>
        </Provider>
    );
};

export default TrezorSuite;
