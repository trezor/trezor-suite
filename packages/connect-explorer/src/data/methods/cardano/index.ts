import getPublicKey from './getPublicKey';
import getAddress from './getAddress';
import signTransaction from './signTransaction';
import signMessage from './signMessage';
import getAccountInfo from './getAccountInfo';
import getNativeScriptHash from './getNativeScriptHash';

export default [
    ...getPublicKey,
    ...getAddress,
    ...signTransaction,
    ...signMessage,
    ...getAccountInfo,
    ...getNativeScriptHash,
];
