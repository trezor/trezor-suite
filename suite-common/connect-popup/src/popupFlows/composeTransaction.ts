import { CommonPopupFlow } from './CommonPopupFlow';
import { describeCall } from '../methodInfo';

export class ComposeTransaction extends CommonPopupFlow<'composeTransaction'> {
    protected getMethodInfo = () => describeCall('Compose transaction');
}
