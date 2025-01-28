import getAccountInfo from './getAccountInfo';
import getAddress from './getAddress';
import getPublicKey from './getPublicKey';
import pushTransaction from './pushTransaction';
import signMessage from './signMessage';
import signTransaction from './signTransaction';
import signTransactionERC20 from './signTransaction-erc20-known';
import signTransactionERC20Unknown from './signTransaction-erc20-unknown';
import signTypedData from './signTypedData';
import verifyMessage from './verifyMessage';

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
