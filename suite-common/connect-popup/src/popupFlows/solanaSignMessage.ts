import { CommonPopupFlow } from './CommonPopupFlow';
import { describeMiscCall } from '../methodInfo';

export class SolanaSignMessage extends CommonPopupFlow<'solanaSignMessage'> {
    protected getMethodInfo = () => describeMiscCall('sol', 'sign_message', 'Sign Solana message');
}
