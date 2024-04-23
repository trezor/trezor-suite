import getPublicKey from './getPublicKey';
import getAddress from './getAddress';
import getAccountInfo from './getAccountInfo';
import signTransaction from './signTransaction';
import signTransactionERC20 from './signTransaction-erc20-known';
import signTransactionERC20Unknown from './signTransaction-erc20-unknown';
import pushTransaction from './pushTransaction';
import signMessage from './signMessage';
import verifyMessage from './verifyMessage';
import signTypedData from './signTypedData';

export default [
    ...getPublicKey,
    ...getAddress,
    ...getAccountInfo,
    ...signTransaction,
    ...signTransactionERC20,
    ...signTransactionERC20Unknown,
    ...pushTransaction,
    // ...composeTransaction,
    ...signMessage,
    ...verifyMessage,
    ...signTypedData,
];
