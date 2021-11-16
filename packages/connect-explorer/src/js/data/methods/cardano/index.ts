import getPublicKey from './getPublicKey';
import getAddress from './getAddress';
import signTransaction from './signTransaction';
import getAccountInfo from './getAccountInfo';

export default [...getPublicKey, ...getAddress, ...signTransaction, ...getAccountInfo];
