import React from 'react';
import { Platform } from 'react-native';
import { Provider } from 'react-redux';
import './support/global';
import Preloader from '@suite-components/Preloader';
import RouterHandler from './support/RouterHandler';

import { initStore } from './reducers/store';

const TrezorSuite = (props: any) => {
    process.env.RN_EMULATOR = props.isEmulator;
    process.env.RN_OS = Platform.OS;

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
