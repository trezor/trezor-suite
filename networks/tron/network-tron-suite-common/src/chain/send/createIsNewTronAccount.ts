import type { GetTrezorConnectDep } from '@trezor/connect-common';
import { toCoinSymbol } from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

export type IsNewTronAccountDeps = GetTrezorConnectDep<'getAccountInfo'>;

export type IsNewTronAccountParams = {
    address: string;
    symbol: NetworkSymbol;
    identity: string | undefined;
};

export type IsNewTronAccount = (params: IsNewTronAccountParams) => Promise<boolean>;

/** Whether paying the address creates its account on-chain, which costs an activation fee. */
export const createIsNewTronAccount =
    (deps: IsNewTronAccountDeps): IsNewTronAccount =>
    async params => {
        if (!params.address) return false;

        const result = await deps.getTrezorConnect().getAccountInfo({
            coin: toCoinSymbol(params.symbol),
            identity: params.identity,
            descriptor: params.address,
        });

        if (!result.success) return false;

        // Transaction history does not imply on-chain activation: an address that has only
        // ever received TRC-20 tokens is not `empty`, yet sending TRX to it still triggers
        // account creation and its activation fee. Every activated account is granted the
        // 600 free-bandwidth allotment, so a missing or zero totalFreeBandwidth means the
        // account does not exist on-chain yet.
        return (
            result.payload.empty ||
            (result.payload.misc?.tronResources?.totalFreeBandwidth ?? 0) === 0
        );
    };
