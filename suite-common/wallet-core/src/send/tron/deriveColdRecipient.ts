import { type TrezorDevice } from '@suite-common/suite-types';
import { type Network } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { substituteBip43Path } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';

type DeriveTronColdRecipientParams = {
    account: Account;
    network: Network;
    accounts?: Account[];
    device?: TrezorDevice;
    chunkify?: boolean;
};

export const deriveTronColdRecipient = async ({
    account,
    network,
    accounts,
    device,
    chunkify,
}: DeriveTronColdRecipientParams): Promise<string | undefined> => {
    if (account.networkType !== 'tron' || !device) return undefined;

    const bip43Path = network.accountTypes[account.accountType]?.bip43Path ?? network.bip43Path;
    // highest existing index + 1 (not count) so a gap can't hit an existing warm account
    const nextIndex =
        (accounts ?? [])
            .filter(a => a.symbol === account.symbol && a.accountType === account.accountType)
            .reduce((max, a) => Math.max(max, a.index), -1) + 1;
    const path = substituteBip43Path(bip43Path, nextIndex);

    const result = await TrezorConnect.tronGetAddress({
        device,
        path,
        showOnTrezor: false,
        chunkify,
    });

    return result.success ? result.payload.address : undefined;
};
