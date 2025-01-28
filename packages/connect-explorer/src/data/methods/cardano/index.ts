import getAccountInfo from './getAccountInfo';
import getAddress from './getAddress';
import getNativeScriptHash from './getNativeScriptHash';
import getPublicKey from './getPublicKey';
import signTransaction from './signTransaction';

export default [
    ...getPublicKey,
    ...getAddress,
    ...signTransaction,
    ...getAccountInfo,
    ...getNativeScriptHash,
];
