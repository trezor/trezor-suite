import { CommonPopupFlow } from './CommonPopupFlow';
import { describeMiscCall } from '../methodInfo';

export class CardanoGetNativeScriptHash extends CommonPopupFlow<'cardanoGetNativeScriptHash'> {
    protected getMethodInfo = () =>
        describeMiscCall('ada', 'read_address', 'Get Cardano native script hash');
}
