import { TrezorBlockchain } from '@trezor/blockchain-core';

import { CommonPopupFlow, type PopupFlowPayload } from './CommonPopupFlow';
import { describeCall, getCoinPermissions, getKnownCoinInfo } from '../methodInfo';

// Suite's backends broadcast the transaction.
export class PushTransaction extends CommonPopupFlow<'pushTransaction'> {
    protected getMethodInfo = async () =>
        describeCall(
            '',
            getCoinPermissions('push_tx', [await getKnownCoinInfo(this.payload.coin)]),
        );

    protected callMethod(payload: PopupFlowPayload<'pushTransaction'>) {
        return TrezorBlockchain.pushTransaction(payload, { signal: this.signal });
    }
}
