import getAccountInfo from './getAccountInfo';
import getAddress from './getAddress';
import pushTransaction from './pushTransaction';
import signTransaction from './signTransaction';

export default [...getAddress, ...getAccountInfo, ...signTransaction, ...pushTransaction];
