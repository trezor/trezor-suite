import { CommonPopupFlow } from './CommonPopupFlow';
import { describeEthereumSigning } from '../methodInfo';

export class EthereumSignMessage extends CommonPopupFlow<'ethereumSignMessage'> {
    protected getMethodInfo = () =>
        describeEthereumSigning(this.payload.path, 'Sign #NETWORK message');
}
