/* @flow */

import getPublicKey from './getPublicKey';
import getAddress from './getAddress';
import signTransaction from './signTransaction';
import signMessage from './signMessage';
import verifyMessage from './verifyMessage';

export default [
    ...getPublicKey,
    ...getAddress,
    ...signTransaction,
    ...signMessage,
    ...verifyMessage,
];