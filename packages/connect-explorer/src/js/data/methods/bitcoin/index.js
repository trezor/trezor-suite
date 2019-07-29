/* @flow */

import getPublicKey from './getPublicKey';
import getAddress from './getAddress';
import getAccountInfo from './getAccountInfo';
import signTransactionPayToAddress from './signTransaction.paytoaddress';
import signTransactionP2SH from './signTransaction.p2sh';
import signTransactionOpreturn from './signTransaction.opreturn';
import signTransactionMultisig from './signTransaction.multisig';
import signTransactionZcash from './signTransaction.zcash';
import signTransactionCustom from './signTransaction.custom';
import pushTransaction from './pushTransaction';
import composeTransaction from './composeTransaction';
import signMessage from './signMessage';
import verifyMessage from './verifyMessage';

export default [
    ...getPublicKey,
    ...getAddress,
    ...getAccountInfo,
    ...signTransactionPayToAddress,
    ...signTransactionP2SH,
    ...signTransactionOpreturn,
    ...signTransactionMultisig,
    ...signTransactionZcash,
    ...signTransactionCustom,
    ...pushTransaction,
    ...composeTransaction,
    ...signMessage,
    ...verifyMessage,
];
