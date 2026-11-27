import { CommonPopupFlow } from './CommonPopupFlow';
import { describeCall } from '../methodInfo';

export class SolanaComposeTransaction extends CommonPopupFlow<'solanaComposeTransaction'> {
    protected getMethodInfo = () => describeCall('Compose Solana transaction');
}
