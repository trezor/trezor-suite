/* eslint-disable no-bitwise */
/**
 * Inject global objects to react-native app
 */
import '@formatjs/intl-getcanonicallocales/polyfill';
import '@formatjs/intl-locale/polyfill';
import '@formatjs/intl-pluralrules/polyfill';
import '@formatjs/intl-pluralrules/locale-data/en';
import '@formatjs/intl-numberformat/polyfill';
import '@formatjs/intl-numberformat/locale-data/en';
import '@formatjs/intl-datetimeformat/polyfill';
import '@formatjs/intl-datetimeformat/locale-data/en';
import '@formatjs/intl-datetimeformat/add-all-tz';

global.Buffer = require('@craftzdog/react-native-buffer').Buffer;
global.process = require('process');
global.crypto = require('crypto');

// global.IntlLocales = require('intl/locale-data/jsonp/en');

global.process.env.NODE_ENV = __DEV__ ? 'development' : 'production';
