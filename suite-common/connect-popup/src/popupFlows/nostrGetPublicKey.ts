import { CommonPopupFlow } from './CommonPopupFlow';
import { describeMiscCall } from '../methodInfo';

export class NostrGetPublicKey extends CommonPopupFlow<'nostrGetPublicKey'> {
    protected getMethodInfo = () =>
        describeMiscCall('nostr', 'read_xpub', 'Export Nostr public key');
}
