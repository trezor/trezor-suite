import { TrezorBlockchain } from '@trezor/blockchain-core';
import { promiseRaceWithSignal } from '@trezor/utils';

import { CommonPopupFlow, type PopupFlowPayload } from './CommonPopupFlow';

// Connect describes the call, Suite's backends broadcast the transaction.
export class PushTransaction extends CommonPopupFlow<'pushTransaction'> {
    protected callMethod(payload: PopupFlowPayload<'pushTransaction'>) {
        return promiseRaceWithSignal(TrezorBlockchain.pushTransaction(payload), this.signal);
    }
}
