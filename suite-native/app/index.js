import 'react-native-gesture-handler';
// Has to stay above './globalPolyfills', see the comment in the module.
import './rozeniteBootRecording';
import './globalPolyfills';
import './reanimatedLoggerFix';
import './src/initSentry';

import { registerRootComponent } from 'expo';

import { markStartupJsBundleEvaluated } from '@suite-native/sentry';

import { createSuiteNativeCompositionRoot } from './src/createSuiteNativeCompositionRoot';

markStartupJsBundleEvaluated();

const { init } = createSuiteNativeCompositionRoot();
const App = init();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
