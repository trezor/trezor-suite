import composeTransaction from './composeTransaction';
import getAccountInfo from './getAccountInfo';
import getAddress from './getAddress';
import getPublicKey from './getPublicKey';
import pushTransaction from './pushTransaction';
import signMessage from './signMessage';
import signTransactionCustom from './signTransaction.custom';
import signTransactionMultisig from './signTransaction.multisig';
import signTransactionOpreturn from './signTransaction.opreturn';
import signTransactionP2SH from './signTransaction.p2sh';
import signTransactionPayToAddress from './signTransaction.paytoaddress';
import signTransactionZcash from './signTransaction.zcash';
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
