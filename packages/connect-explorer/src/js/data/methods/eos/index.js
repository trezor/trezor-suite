/* @flow */

import getPublicKey from './getPublicKey';
import signTransaction from './signTransaction';

export default [
    ...getPublicKey,
    ...signTransaction,
];