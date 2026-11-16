import { useWatch } from 'react-hook-form';

import { injectGetNetwork } from '@suite-common/networks';
import { findToken } from '@suite-common/wallet-utils';
import { useGetter } from '@trezor/dependency-injection';
import type { SendOptions, SendTransfer } from '@trezor/network-module-suite-common-types';

import { useSendFormContext } from '#src/hooks/wallet';

export type ResolvedSendOptions = {
    /** The family serving the account's network, so the form can pick an override for it. */
    readonly family: string | undefined;
    readonly options: SendOptions;
    /** What the first recipient receives, for options that depend on it. */
    readonly transfer: SendTransfer;
};

/**
 * What this send can do beyond an amount and an address, for the account's network as it is
 * served right now. Every part of the send form reads its option from here and never asks which
 * network it is on.
 */
export const useSendOptions = (): ResolvedSendOptions => {
    const { account, control } = useSendFormContext();
    const network = useGetter(injectGetNetwork, {
        symbol: account.symbol,
        accountType: account.accountType,
    });
    const tokenContract = useWatch({ name: 'outputs.0.token', control });
    const token = findToken(account.tokens, tokenContract);

    return {
        family: network?.family,
        options: network?.capabilities.sendOptions ?? {},
        transfer: { token: token && { contract: token.contract, standard: token.standard } },
    };
};
