/**
 * Inject global objects to react-native app
 */

global.Buffer = require('buffer').Buffer;
global.process = require('process');
global.Intl = require('intl');
global.IntlLocales = require('intl/locale-data/jsonp/en');

global.process.env.NODE_ENV = __DEV__ ? 'development' : 'production';
