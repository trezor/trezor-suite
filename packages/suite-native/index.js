import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';

// TODO: https://www.fabrizioduroni.it/2017/12/08/react-native-multiple-instance-rctrootview.html
AppRegistry.registerComponent(appName, () => App);
