import { type CoinInfo } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import {
    type AddressSelection,
    SelectAccount as SelectAccountSchema,
} from '@trezor/connect-common/src/types/api/selectAccount';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage, MethodReturnType } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getCoinInfoOrThrow } from '../data/coinInfo';

type Params = {
    coinInfo: CoinInfo;
    addressSelection?: AddressSelection;
};

export default class SelectAccount extends AbstractMethod<'selectAccount', Params> {
    constructor(message: MethodMessage<'selectAccount'>) {
        const { payload } = message;

        Assert(SelectAccountSchema, payload);

        // The schema can't express the cross-field `minCount <= maxCount`, so reject an inverted
        // bound here — otherwise the picker opens with a Connect button that can never enable.
        // Narrow first: Assert lets an optional field be `null`, and `typeof null === 'object'`.
        const { selectionType } = payload;
        const bounds =
            typeof selectionType === 'object' && selectionType !== null ? selectionType : undefined;
        if (
            bounds?.minCount !== undefined &&
            bounds.maxCount !== undefined &&
            bounds.minCount > bounds.maxCount
        ) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                'selectionType.minCount cannot be greater than selectionType.maxCount',
            );
        }

        const coinInfo = getCoinInfoOrThrow(payload.coin);

        super(message, { coinInfo, addressSelection: payload.addressSelection });

        // The picker UI, account derivation and on-device verification are handled entirely by the
        // host (Suite) via a popup flow. This method neither uses the device nor blocks: it returns
        // immediately so its call is freed, letting the host make its own nested device calls
        // (derive/verify) while the picker is open. The host overrides the response with the user's
        // selection once they confirm — the value returned here is only a placeholder.
        this.useDevice = false;
        this.useDeviceState = false;
        this.requiredFirmwareCoins = [coinInfo];
    }

    run(): Promise<MethodReturnType<'selectAccount'>> {
        return Promise.resolve([]);
    }
}
