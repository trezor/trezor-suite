import getAddress from './getAddress';
import getAccountInfo from './getAccountInfo';
import signTransaction from './signTransaction';
import pushTransaction from './pushTransaction';

export default [...getAddress, ...getAccountInfo, ...signTransaction, ...pushTransaction];
