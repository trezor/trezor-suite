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
};

export const deriveTronColdRecipient = async ({
    account,
    network,
    accounts,
    device,
}: DeriveTronColdRecipientParams): Promise<string | undefined> => {
    if (account.networkType !== 'tron') {
        return undefined;
    }

    const walletAccounts = (accounts ?? []).filter(
        a =>
            a.deviceState === account.deviceState &&
            a.symbol === account.symbol &&
            a.accountType === account.accountType,
    );

    // failed discovery accounts are also flagged empty but carry a synthetic (non-address) descriptor
    const coldAccount = walletAccounts.reduce<Account | undefined>(
        (best, a) => (a.empty && !a.failed && (!best || a.index > best.index) ? a : best),
        undefined,
    );

    if (coldAccount) {
        return coldAccount.descriptor;
    }

    if (!device) {
        return undefined;
    }

    const bip43Path = network.accountTypes[account.accountType]?.bip43Path ?? network.bip43Path;
    // highest existing index + 1 (not count) so a gap can't hit an existing warm account;
    // seed with account.index so an empty/omitted accounts list can't derive index 0 over the source account
    const nextIndex = walletAccounts.reduce((max, a) => Math.max(max, a.index), account.index) + 1;
    const path = substituteBip43Path(bip43Path, nextIndex);

    const result = await TrezorConnect.tronGetAddress({
        device,
        path,
        showOnTrezor: false,
    });

    return result.success ? result.payload.address : undefined;
};
