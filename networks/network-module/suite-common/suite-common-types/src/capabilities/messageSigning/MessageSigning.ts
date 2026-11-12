import type { DeviceIdentity, ERRORS } from '@trezor/connect-common';
import type { Branded, Result } from '@trezor/type-utils';

import type { Label } from '../Label';
import type { AddressRef, OpenAccount } from '../OpenAccount';

export type MessageSigningError = ERRORS.SerializedError;

/** Whether a choice changes the signature itself or only how the public key is encoded. */
export type SignChoiceKind = 'signature' | 'publicKey';

/**
 * An option a family offered for one account. Only the family boundary mints these, so shared
 * code can hand back nothing but an id it was given: there is no way to ask Bitcoin for a COSE key.
 *
 * @see https://www.typescriptlang.org/docs/handbook/2/types-from-types.html — the brand is an
 * intersection type, so a plain string is not assignable to it.
 */
export type SignChoiceOptionId = string & Branded<'SignChoiceOptionId'>;

export type SignChoiceOption = {
    readonly id: SignChoiceOptionId;
    readonly label: Label;
};

/**
 * One of a family's own signing parameters, as shared code sees it: what to label and which
 * options exist, but not the family's value type. Only parameters with more than one option for
 * the account are offered.
 */
export type SignChoice = {
    /** The family's name for the parameter, such as Bitcoin's `format`. */
    readonly key: string;
    readonly kind: SignChoiceKind;
    readonly label: Label;
    /** Explains the options; may carry rich-text tags the UI renders. */
    readonly tooltip?: Label;
    /** The first option is the one the form starts with. */
    readonly options: readonly SignChoiceOption[];
};

/** The option chosen per choice, by the choice's `key`. A choice left out takes its first option. */
export type SignSelection = Readonly<Partial<Record<string, SignChoiceOptionId>>>;

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

/** What every family needs to sign, whatever its own parameters are. */
export type SignMessageBaseParams = {
    readonly device: DeviceIdentity;
    readonly account: OpenAccount;
    readonly path: string;
    readonly message: string;
    readonly isHex: boolean;
    readonly isChunkified?: boolean;
};

export type SignMessageParams = SignMessageBaseParams & {
    /** Options picked from `getChoices`; omitted ones take the family's first option. */
    readonly selection?: SignSelection;
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
 * Everything a page needs to render is here: what to label, whether the address is fixed, which of
 * the family's own parameters the user may choose and what the result contains. None of it is
 * typed by a family, so code that works for every network calls it without naming one.
 * Verification is supported exactly when `verify` exists.
 *
 * @serviceContract
 */
export type MessageSigning = {
    readonly labels: MessageSigningLabels;
    readonly addressSelection: SignAddressSelection;
    readonly outputs: readonly SignOutput[];
    getChoices(account: OpenAccount): readonly SignChoice[];
    getSignAddressGroups(params: GetSignAddressGroupsParams): readonly SignAddressGroup[];
    sign(params: SignMessageParams): Promise<Result<SignedMessage, MessageSigningError>>;
    verify?: (params: VerifyMessageParams) => Promise<Result<void, MessageSigningError>>;
    showAddress?: (
        params: ShowSignAddressParams,
    ) => Promise<Result<AddressRef, MessageSigningError>>;
};

/**
 * A family's own signing parameters, such as `{ format: 'default' | 'electrum' }` for Bitcoin.
 * Their names cannot reuse those every family shares, so a family parameter never silently
 * replaces one of them.
 */
export type SignParams = Readonly<Record<string, unknown>> & {
    readonly [Key in keyof SignMessageParams]?: never;
};

/**
 * Message signing as its own family types it: the shared contract, plus signing with the family's
 * parameters as values of their own types. Code reaches it after narrowing a network to the family,
 * see `NetworkFamily.isOwnNetwork`.
 *
 * @see https://www.typescriptlang.org/docs/handbook/2/generics.html — `TParams` is chosen by each
 * family, so one contract serves families with different parameters.
 */
export type FamilyMessageSigning<TParams extends SignParams> = MessageSigning & {
    signWithParams(
        params: SignMessageBaseParams & TParams,
    ): Promise<Result<SignedMessage, MessageSigningError>>;
};

export type SignParamOption<TValue> = {
    /** Stable and unique within the parameter; UIs and analytics refer to the option by it. */
    readonly id: string;
    readonly label: Label;
    readonly value: TValue;
};

/** At least one option, so every parameter always has a value to sign with. */
export type SignParamOptions<TValue> = readonly [
    SignParamOption<TValue>,
    ...SignParamOption<TValue>[],
];

export type SignParamField<TAccount, TValue> = {
    readonly kind: SignChoiceKind;
    readonly label: Label;
    readonly tooltip?: Label;
    /**
     * The options this account may choose from, in display order, the default first. A single
     * option fixes the value without offering a choice.
     */
    getOptions(account: TAccount): SignParamOptions<TValue>;
};

/**
 * One field per family parameter, each typed by its own value.
 *
 * @see https://www.typescriptlang.org/docs/handbook/2/mapped-types.html — every key of `TParams`
 * needs a field, and a field's options carry that key's value type.
 */
export type SignParamFields<TAccount, TParams extends SignParams> = {
    readonly [Key in keyof TParams]-?: SignParamField<TAccount, TParams[Key]>;
};

export type ClosedSignMessageParams<TAccount, TParams extends SignParams> = Omit<
    SignMessageBaseParams,
    'account'
> & {
    readonly account: TAccount;
} & TParams;

export type ClosedVerifyMessageParams<TAccount> = Omit<VerifyMessageParams, 'account'> & {
    readonly account: TAccount;
};

export type ClosedShowSignAddressParams<TAccount> = Omit<ShowSignAddressParams, 'account'> & {
    readonly account: TAccount;
};

/**
 * What a family implements, written against its own account type and its own parameters only.
 *
 * `defineMessageSigning` turns it into a `FamilyMessageSigning`, narrowing every account and
 * checking every parameter on the way in, so none of the functions below ever sees data from
 * another family or a value it did not offer.
 */
export type MessageSigningDefinition<TAccount, TParams extends SignParams> = {
    readonly labels: MessageSigningLabels;
    readonly addressSelection: SignAddressSelection;
    readonly outputs: readonly SignOutput[];
    /** Reads what the family needs from the app's account; `undefined` rejects the account. */
    toAccount(account: OpenAccount): TAccount | undefined;
    readonly params: SignParamFields<TAccount, TParams>;
    getSignAddressGroups(
        account: TAccount,
        touchedAddresses: readonly AddressRef[],
    ): readonly SignAddressGroup[];
    sign(
        params: ClosedSignMessageParams<TAccount, TParams>,
    ): Promise<Result<SignedMessage, MessageSigningError>>;
    verify?: (
        params: ClosedVerifyMessageParams<TAccount>,
    ) => Promise<Result<void, MessageSigningError>>;
    showAddress?: (
        params: ClosedShowSignAddressParams<TAccount>,
    ) => Promise<Result<AddressRef, MessageSigningError>>;
};
