import getPublicKey from './getPublicKey';
import getAddress from './getAddress';
import signTransaction from './signTransaction';

export default [...getPublicKey, ...getAddress, ...signTransaction];
