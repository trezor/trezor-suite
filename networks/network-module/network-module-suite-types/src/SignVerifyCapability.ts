import type { ComponentType } from 'react';

import type { ExtendedMessageDescriptor, TranslationKey } from '@suite/intl';
import type { TrezorDevice } from '@suite-common/suite-types';
import type { Network } from '@suite-common/wallet-config';
import type { Account, ReceiveInfo } from '@suite-common/wallet-types';
import type { Result } from '@trezor/type-utils';

export type SignAddress = {
    address: string;
    path: string;
    category: ExtendedMessageDescriptor['id'] | '';
};

export type SignVerifyOperationParams = {
    device: TrezorDevice;
    account: Account;
    coin: Account['symbol'];
    chunkify?: boolean;
};

export type SignVerifySignParams = SignVerifyOperationParams & {
    path: string | number[];
    message: string;
    hex: boolean;
    signOption: boolean;
};

export type SignVerifyVerifyParams = SignVerifyOperationParams & {
    address: string;
    message: string;
    signature: string;
    hex: boolean;
};

export type SignVerifyShowAddressParams = SignVerifyOperationParams & {
    address: string;
    path: string;
};

export type SignVerifySignResult = {
    signature: string;
    address?: string;
    additionalResult?: string;
};

type SignVerifyOperationError = {
    message: string;
};

export type SignVerifyOperationResult<T> = Result<T, SignVerifyOperationError>;

export type SignOptionField = {
    selectedOption: boolean | undefined;
    onChange: (value: boolean) => void;
};

export type SignOptionComponentProps = {
    account: Account;
    network?: Network;
    field: SignOptionField;
};

export type SignAdditionalResultComponentProps = {
    value: string;
    canCopy: boolean;
};

export type SignedMessageData = {
    message?: string;
    address?: string;
    signature?: string;
};

export type SignVerifyInitialValues = {
    path?: string;
    address?: string;
    signOption?: boolean;
};

export type SignVerifyCapability = {
    getSignAddresses: (account: Account, touchedAddresses: ReceiveInfo[]) => SignAddress[];
    getInitialValues?: (
        account: Account,
        isSignPage: boolean,
    ) => SignVerifyInitialValues | undefined;
    isPathDisabled?: (account: Account) => boolean;
    sign: (
        params: SignVerifySignParams,
    ) => Promise<SignVerifyOperationResult<SignVerifySignResult>>;
    verify?: (params: SignVerifyVerifyParams) => Promise<SignVerifyOperationResult<unknown>>;
    showAddress?: (
        params: SignVerifyShowAddressParams,
    ) => Promise<SignVerifyOperationResult<unknown>>;
    formatSignedMessage: (data: SignedMessageData, network?: Network) => string;
    copyButtonTranslationId?: TranslationKey;
    SignAddressOptions?: ComponentType<SignOptionComponentProps>;
    SignOptions?: ComponentType<SignOptionComponentProps>;
    SignAdditionalResult?: ComponentType<SignAdditionalResultComponentProps>;
};

export type SignVerifyCapabilityHelpers = {
    formatSignedMessage: (data: SignedMessageData, network?: string) => string;
    getAccountAddressesForSigning: SignVerifyCapability['getSignAddresses'];
};
