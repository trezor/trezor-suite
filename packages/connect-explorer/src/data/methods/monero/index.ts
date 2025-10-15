import getAddress from './getAddress';
import getWatchKey from './getWatchKey';
import keyImageSync from './keyImageSync';
import signTransaction from './signTransaction';

export default [...getAddress, ...getWatchKey, ...keyImageSync, ...signTransaction];
