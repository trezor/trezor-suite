import { CommonPopupFlow } from './CommonPopupFlow';
import { describeMiscCall } from '../methodInfo';

export class NostrSignEvent extends CommonPopupFlow<'nostrSignEvent'> {
    protected getMethodInfo = () => describeMiscCall('nostr', 'sign', 'Sign Nostr event');
}
