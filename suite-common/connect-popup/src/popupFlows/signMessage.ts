import { getLabel } from '@trezor/connect-common/src/utils/pathUtils';

import { CommonPopupFlow } from './CommonPopupFlow';
import { describeCall, getBitcoinCoinInfo, getCoinPermissions } from '../methodInfo';

export class SignMessage extends CommonPopupFlow<'signMessage'> {
    protected getMethodInfo = async () => {
        const coinInfo = await getBitcoinCoinInfo(this.payload.coin, this.payload.path);

        return describeCall(
            getLabel('Sign #NETWORK message', coinInfo),
            getCoinPermissions('sign_message', [coinInfo]),
        );
    };
}
