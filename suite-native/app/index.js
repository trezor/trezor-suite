import 'react-native-gesture-handler';
// Has to stay above './globalPolyfills', see the comment in the module.
import './rozeniteBootRecording';
import './globalPolyfills';
import './reanimatedLoggerFix';

import { registerRootComponent } from 'expo';

import { App } from './src/App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
