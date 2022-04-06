import './globalPolyfills';
import { AppRegistry } from 'react-native';

import { name as appName } from './app.json';
import { App } from './src/App';
import './globalPolyfills';

AppRegistry.registerComponent(appName, () => App);
