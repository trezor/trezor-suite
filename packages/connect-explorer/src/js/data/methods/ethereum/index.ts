import getPublicKey from './getPublicKey';
import getAddress from './getAddress';
import getAccountInfo from './getAccountInfo';
import signTransaction from './signTransaction';
import signTransactionERC20 from './signTransaction.erc20';
import pushTransaction from './pushTransaction';
import signMessage from './signMessage';
import verifyMessage from './verifyMessage';

export default [
    ...getPublicKey,
    ...getAddress,
    ...getAccountInfo,
    ...signTransaction,
    ...signTransactionERC20,
    ...pushTransaction,
    // ...composeTransaction,
    ...signMessage,
    ...verifyMessage,
];
