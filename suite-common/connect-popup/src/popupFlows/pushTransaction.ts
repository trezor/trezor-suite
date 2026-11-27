import { TrezorBlockchain } from '@trezor/blockchain-core';

import { CommonPopupFlow, type PopupFlowPayload } from './CommonPopupFlow';

// Suite's backends broadcast the transaction.
export class PushTransaction extends CommonPopupFlow<'pushTransaction'> {
    protected callMethod(payload: PopupFlowPayload<'pushTransaction'>) {
        return TrezorBlockchain.pushTransaction(payload, { signal: this.signal });
    }
}
