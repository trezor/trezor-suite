import type { OpenAccount } from './OpenAccount';
import type { NetworkDescription } from './defineFamily';

/**
 * A capability is created for one network in one context, so it serves only accounts of that
 * network and, when the context names one, of that account type.
 */
export const isAccountOfNetwork = (
    account: OpenAccount,
    network: NetworkDescription<string>,
): boolean =>
    account.symbol === network.symbol &&
    (network.context.accountType === undefined ||
        account.accountType === network.context.accountType);
