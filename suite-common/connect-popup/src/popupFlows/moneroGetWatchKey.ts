import { CommonPopupFlow } from './CommonPopupFlow';
import { describeMiscCall } from '../methodInfo';

export class MoneroGetWatchKey extends CommonPopupFlow<'moneroGetWatchKey'> {
    protected getMethodInfo = () =>
        describeMiscCall('xmr', 'read_xpub', 'Export Monero watch-only credentials');
}
