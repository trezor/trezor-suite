import 'react-native-gesture-handler';
import './globalPolyfills';
import { AppRegistry } from 'react-native';

import { name as appName } from './app.json';
import { App } from './src/App';

if (__DEV__) {
    // Flipper plugin for debugging websocket traffic.
    // more: https://github.com/Matju-M/flipper-plugin-basil-ws
    // eslint-disable-next-line global-require, chai-friendly/no-unused-expressions
    require('basil-ws-flipper').wsDebugPlugin;
}

AppRegistry.registerComponent(appName, () => App);
