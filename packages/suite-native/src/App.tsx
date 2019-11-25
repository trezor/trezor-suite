import React, { useEffect } from 'react';
import { Platform, SafeAreaView } from 'react-native';
import { Provider } from 'react-redux';
// import 'react-native-gesture-handler'; // https://reactnavigation.org/docs/en/getting-started.html
import './support/global';
import Preloader from './support/TemporaryPreloader';
import RouterHandler from './support/RouterHandler';
import { initStore } from './reducers/store';

const TrezorSuite = (props: any) => {
    process.env.RN_EMULATOR = props.isEmulator;
    process.env.RN_OS = Platform.OS;
    const store = initStore();
    return (
        <SafeAreaView
            style={{
                flex: 1,
                backgroundColor: 'powderblue',
            }}
        >
            <Provider store={store}>
                <Preloader isStatic={false}>
                    <RouterHandler />
                </Preloader>
            </Provider>
        </SafeAreaView>
    );
};

export default TrezorSuite;
