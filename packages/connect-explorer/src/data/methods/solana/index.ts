import getAccountInfo from './getAccountInfo';
import getAddress from './getAddress';
import getPublicKey from './getPublicKey';
import signTransaction from './signTransaction';

export default [...getPublicKey, ...getAddress, ...signTransaction, ...getAccountInfo];
