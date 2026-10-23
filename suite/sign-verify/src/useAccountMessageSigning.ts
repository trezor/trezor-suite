import { injectGetNetwork } from '@suite-common/networks';
import type { Account } from '@suite-common/wallet-types';
import { useGetter } from '@trezor/dependency-injection';
import type { MessageSigning } from '@trezor/network-module-suite-common-types';

/** The message signing of the account's network, resolved for its type and current backend. */
export const useAccountMessageSigning = (
    account: Account | undefined,
): MessageSigning | undefined =>
    useGetter(injectGetNetwork, { symbol: account?.symbol, accountType: account?.accountType })
        ?.capabilities.messageSigning;
