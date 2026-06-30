import { type CoinInfo, type PermissionRequest } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { SelectAccount as SelectAccountSchema } from '@trezor/connect-common/src/types/api/selectAccount';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage, MethodReturnType } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getCoinInfo } from '../data/coinInfo';
import { isUtxoBased } from '../utils/accountUtils';
import { getLabel } from '../utils/pathUtils';

type Params = {
    coinInfo: CoinInfo;
    addressSelection?: 'fullAccount' | 'firstFresh' | 'manual';
};

export default class SelectAccount extends AbstractMethod<'selectAccount', Params> {
    constructor(message: MethodMessage<'selectAccount'>) {
        const { payload } = message;

        Assert(SelectAccountSchema, payload);

        const coinInfo = getCoinInfo(payload.coin);
        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        }

        super(message, { coinInfo, addressSelection: payload.addressSelection });

        // The picker UI, account derivation and on-device verification are handled entirely by the
        // host (Suite) via a methodHook. This method neither uses the device nor blocks: it returns
        // immediately so its call is freed, letting the host make its own nested device calls
        // (derive/verify) while the picker is open. The host overrides the response with the user's
        // selection once they confirm — the value returned here is only a placeholder.
        this.useDevice = false;
        this.useDeviceState = false;
        this.useUi = true;
        this.requiredFirmwareCoins = [coinInfo];
    }

    get requiredPermissions(): PermissionRequest[] {
        // UTXO coins have two separate flows: sharing the whole account as an xpub (omitted or
        // `addressSelection: 'fullAccount'`) needs the broader `read_xpub`, while picking
        // individual address(es) (`addressSelection: 'firstFresh' | 'manual'`) only needs
        // `read_address`, same as EVM/other account-based networks, which always export an
        // individual address.
        const isFullAccount =
            this.params.addressSelection === undefined ||
            this.params.addressSelection === 'fullAccount';
        const permission =
            isUtxoBased(this.params.coinInfo) && isFullAccount ? 'read_xpub' : 'read_address';

        return this.coinPerms(permission, this.requiredFirmwareCoins);
    }

    get info() {
        return getLabel('Select #NETWORK account', this.params.coinInfo);
    }

    run(): Promise<MethodReturnType<'selectAccount'>> {
        return Promise.resolve([]);
    }
}
