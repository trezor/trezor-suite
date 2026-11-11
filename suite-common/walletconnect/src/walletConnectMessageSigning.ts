import { type PopupGetNetworkDeps, createPopupGetNetwork } from '@suite-common/connect-popup';
import type { TrezorDevice } from '@suite-common/suite-types';
import type { Account } from '@suite-common/wallet-types';

type SignWalletConnectMessageParams = {
    readonly device: TrezorDevice | undefined;
    readonly account: Account;
    readonly path: string;
    readonly message: string;
    readonly isHex: boolean;
};

/**
 * Signs a message a dapp asked for with the message signing of the account's network, the same
 * one the Sign & Verify page uses. The network reaches the device through the popup, so the
 * request is shown to the user under the dapp's name before the device is asked.
 */
export const signWalletConnectMessage = (
    { device, account, path, message, isHex }: SignWalletConnectMessageParams,
    deps: PopupGetNetworkDeps,
) => {
    const messageSigning = createPopupGetNetwork(deps)({
        symbol: account.symbol,
        accountType: account.accountType,
    })?.capabilities.messageSigning;

    if (!messageSigning) throw new Error('Message signing is not supported for this account');
    if (!device) throw new Error('Device not found');

    return messageSigning.sign({ device, account, path, message, isHex });
};
