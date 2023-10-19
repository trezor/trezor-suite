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

global.Buffer = require('buffer').Buffer;
global.process = require('process');

// There is bug in buffer polyfill that when you call subarray it returns Uint8Array instead of Buffer, this fixes it
// It's basically copy pasted slice method from buffer polyfill with one change in line `const newBuf...`
Buffer.prototype.subarray = function subarray(start, end) {
    const len = this.length;
    start = ~~start;
    end = end === undefined ? len : ~~end;

    if (start < 0) {
        start += len;
        if (start < 0) start = 0;
    } else if (start > len) {
        start = len;
    }

    if (end < 0) {
        end += len;
        if (end < 0) end = 0;
    } else if (end > len) {
        end = len;
    }

    if (end < start) end = start;

    const newBuf = Uint8Array.prototype.subarray.call(this, start, end);

    // Return an augmented `Uint8Array` instance
    Object.setPrototypeOf(newBuf, Buffer.prototype);

    return newBuf;
};

// global.IntlLocales = require('intl/locale-data/jsonp/en');

global.process.env.NODE_ENV = __DEV__ ? 'development' : 'production';
