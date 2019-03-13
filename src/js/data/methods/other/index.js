/* @flow */

import login from './login';
import cipherkey from './cipherkey';
import customMessage from './customMessage';

export default [
    ...login,
    ...cipherkey,
    ...customMessage,
];