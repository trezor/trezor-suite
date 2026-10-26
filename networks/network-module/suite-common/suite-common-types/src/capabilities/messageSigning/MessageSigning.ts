import type { DeviceIdentity, ERRORS } from '@trezor/connect-common';
import type { Branded, Result } from '@trezor/type-utils';

import type { Label } from '../Label';
import type { AddressRef, OpenAccount } from '../OpenAccount';

export type SignFormatId = 'default' | 'electrum' | 'cose';

/**
 * A format a family offered for one account. Only the family boundary mints these, so the UI can
 * hand back nothing but a value it was given: there is no way to ask Bitcoin for a COSE key.
 */
export type SignFormat = SignFormatId & Branded<'SignFormat'>;

export type MessageSigningError = ERRORS.SerializedError;

/** Whether the choice changes the signature itself or only how the public key is encoded. */
export type SignFormatKind = 'signature' | 'publicKey';

export type SignFormatOption = {
    readonly format: SignFormat;
    readonly label: Label;
};

export type SignFormatChoice = {
    readonly kind: SignFormatKind;
    readonly label: Label;
    /** Explains the options; may carry rich-text tags the UI renders. */
    readonly tooltip?: Label;
    /** The first option is the one the form starts with. */
    readonly options: readonly SignFormatOption[];
};

/** What a group of addresses is, for UIs that present it in their own way. */
export type SignAddressCategory = 'account' | 'staking' | 'fresh' | 'used' | 'change';

export type SignAddressGroup = {
    readonly category: SignAddressCategory;
    /** `null` for a group that needs no heading, such as Ethereum's single account address. */
    readonly label: Label | null;
    readonly addresses: readonly AddressRef[];
};

/** `fixed` networks sign with the one account address; `pick` networks let the user choose. */
export type SignAddressSelection = 'fixed' | 'pick';

export type SignOutput = 'signature' | 'publicKey';

export type SignedMessage = {
    readonly signature: string;
    readonly publicKey?: string;
    readonly address?: string;
};

export type GetSignAddressGroupsParams = {
    readonly account: OpenAccount;
    /** Addresses the user already revealed on the receive screen, newest first. */
    readonly touchedAddresses: readonly AddressRef[];
};

export type SignMessageParams = {
    readonly device: DeviceIdentity;
    readonly account: OpenAccount;
    readonly path: string;
    readonly message: string;
    readonly isHex: boolean;
    readonly format?: SignFormat;
    readonly isChunkified?: boolean;
};

export type VerifyMessageParams = {
    readonly device: DeviceIdentity;
    readonly account: OpenAccount;
    readonly address: string;
    readonly message: string;
    readonly signature: string;
    readonly isHex: boolean;
};

export type ShowSignAddressParams = {
    readonly device: DeviceIdentity;
    readonly account: OpenAccount;
    readonly address: string;
    readonly path: string;
    readonly isChunkified?: boolean;
};

export type MessageSigningLabels = {
    /** Page and menu title; families that cannot verify name only the signing. */
    readonly title: Label;
};

/**
 * Signing and verifying messages on the device, as every UI and the shared thunks see it.
 *
 * Everything a page needs to render is here: what to label, whether the address is fixed, which
 * formats exist and what the result contains. Verification is supported exactly when `verify`
 * exists.
 *
 * @serviceContract
 */
export type MessageSigning = {
    readonly labels: MessageSigningLabels;
    readonly addressSelection: SignAddressSelection;
    readonly outputs: readonly SignOutput[];
    getFormatChoice(account: OpenAccount): SignFormatChoice | null;
    getSignAddressGroups(params: GetSignAddressGroupsParams): readonly SignAddressGroup[];
    sign(params: SignMessageParams): Promise<Result<SignedMessage, MessageSigningError>>;
    verify?: (params: VerifyMessageParams) => Promise<Result<void, MessageSigningError>>;
    showAddress?: (
        params: ShowSignAddressParams,
    ) => Promise<Result<AddressRef, MessageSigningError>>;
};

export type MessageSigningFormatsDefinition<TAccount, TFormat extends SignFormatId> = {
    readonly kind: SignFormatKind;
    readonly label: Label;
    readonly tooltip?: Label;
    /** Exhaustive: a family cannot offer a format it has no label for. */
    readonly options: { readonly [Format in TFormat]: Label };
    /** Formats this account may choose from, in display order; empty when there is no choice. */
    getAvailable(account: TAccount): readonly TFormat[];
};

export type ClosedSignMessageParams<TAccount, TFormat extends SignFormatId> = Omit<
    SignMessageParams,
    'account' | 'format'
> & {
    readonly account: TAccount;
    readonly format: TFormat | undefined;
};

export type ClosedVerifyMessageParams<TAccount> = Omit<VerifyMessageParams, 'account'> & {
    readonly account: TAccount;
};

export type ClosedShowSignAddressParams<TAccount> = Omit<ShowSignAddressParams, 'account'> & {
    readonly account: TAccount;
};

/**
 * What a family implements, written against its own account type and its own formats only.
 *
 * `defineMessageSigning` turns it into the open `MessageSigning`, narrowing every account and
 * format on the way in, so none of the functions below ever sees data from another family.
 */
export type MessageSigningDefinition<TAccount, TFormat extends SignFormatId = never> = {
    readonly labels: MessageSigningLabels;
    readonly addressSelection: SignAddressSelection;
    readonly outputs: readonly SignOutput[];
    /** Reads what the family needs from the app's account; `undefined` rejects the account. */
    toAccount(account: OpenAccount): TAccount | undefined;
    readonly formats?: MessageSigningFormatsDefinition<TAccount, TFormat>;
    getSignAddressGroups(
        account: TAccount,
        touchedAddresses: readonly AddressRef[],
    ): readonly SignAddressGroup[];
    sign(
        params: ClosedSignMessageParams<TAccount, TFormat>,
    ): Promise<Result<SignedMessage, MessageSigningError>>;
    verify?: (
        params: ClosedVerifyMessageParams<TAccount>,
    ) => Promise<Result<void, MessageSigningError>>;
    showAddress?: (
        params: ClosedShowSignAddressParams<TAccount>,
    ) => Promise<Result<AddressRef, MessageSigningError>>;
};
