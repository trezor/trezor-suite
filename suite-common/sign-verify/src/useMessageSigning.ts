import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { injectGetNetwork } from '@suite-common/networks';
import { type ReceiveRootState, selectTouchedAddresses } from '@suite-common/receive';
import type { Account } from '@suite-common/wallet-types';
import { useGetter, useServices } from '@trezor/dependency-injection';
import type {
    AddressRef,
    Label,
    MessageSigning,
    SignAddressGroup,
    SignChoice,
    SignedMessage,
} from '@trezor/network-module-suite-common-types';
import { injectDispatch } from '@trezor/redux-utils';

import {
    type ShowAddressThunkParams,
    type SignThunkParams,
    type VerifyMessageResult,
    type VerifyThunkParams,
    showAddressThunk,
    signThunk,
    verifyThunk,
} from './signVerifyActions';

/**
 * Everything a sign & verify UI needs from the account's network, with no opinion on how it looks.
 *
 * Any form can render from this: the generic one, a network's own override, or a native screen.
 * The operations dispatch the shared thunks, so toasts, analytics and device handling stay the
 * same whichever UI calls them.
 */
export type MessageSigningController = {
    /** The family serving the account's network, so an app can pick an override for it. */
    readonly family: string;
    readonly messageSigning: MessageSigning;
    readonly title: Label;
    readonly canVerify: boolean;
    readonly isAddressFixed: boolean;
    /** The one address a fixed-address network signs with. */
    readonly fixedAddress: AddressRef | undefined;
    readonly addressGroups: readonly SignAddressGroup[];
    /** The family's own parameters the user may choose, such as Bitcoin's signature format. */
    readonly choices: readonly SignChoice[];
    readonly hasPublicKeyOutput: boolean;
    sign(params: Omit<SignThunkParams, 'account'>): Promise<SignedMessage | false>;
    verify(params: Omit<VerifyThunkParams, 'account'>): Promise<VerifyMessageResult>;
    showAddress(params: Omit<ShowAddressThunkParams, 'account'>): Promise<AddressRef | false>;
};

/** `undefined` while no account is selected, or when its network cannot sign messages. */
export const useMessageSigning = (
    account: Account | undefined,
): MessageSigningController | undefined => {
    const network = useGetter(injectGetNetwork, {
        symbol: account?.symbol,
        accountType: account?.accountType,
    });
    const { dispatch } = useServices(injectDispatch);
    const touchedAddresses = useSelector((state: ReceiveRootState) =>
        selectTouchedAddresses(state, account?.key),
    );
    const messageSigning = network?.capabilities.messageSigning;

    return useMemo(() => {
        if (account === undefined || network === undefined || messageSigning === undefined) {
            return undefined;
        }

        const isAddressFixed = messageSigning.addressSelection === 'fixed';
        const addressGroups = messageSigning.getSignAddressGroups({ account, touchedAddresses });

        return {
            family: network.family,
            messageSigning,
            title: messageSigning.labels.title,
            canVerify: messageSigning.verify !== undefined,
            isAddressFixed,
            fixedAddress: isAddressFixed ? addressGroups[0]?.addresses[0] : undefined,
            addressGroups,
            choices: messageSigning.getChoices(account),
            hasPublicKeyOutput: messageSigning.outputs.includes('publicKey'),
            sign: params => dispatch(signThunk({ ...params, account })),
            verify: params => dispatch(verifyThunk({ ...params, account })),
            showAddress: params => dispatch(showAddressThunk({ ...params, account })),
        };
    }, [account, network, messageSigning, touchedAddresses, dispatch]);
};
