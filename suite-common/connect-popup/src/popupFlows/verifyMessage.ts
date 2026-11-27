import { getLabel } from '@trezor/connect-common/src/utils/pathUtils';

import { CommonPopupFlow } from './CommonPopupFlow';
import { describeCall, getBitcoinCoinInfo, getCoinPermissions } from '../methodInfo';

export class VerifyMessage extends CommonPopupFlow<'verifyMessage'> {
    protected getMethodInfo = async () => {
        const coinInfo = await getBitcoinCoinInfo(this.payload.coin);

        return describeCall(
            getLabel('Verify #NETWORK message', coinInfo),
            getCoinPermissions('verify_message', [coinInfo]),
        );
    };
}
