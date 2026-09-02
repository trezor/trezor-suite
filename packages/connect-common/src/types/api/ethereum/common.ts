import { MessagesSchema as PROTO } from '@trezor/protobuf';
import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import { DerivationPath } from '../../params';

// ethereumSignAuth7702

/**
 * EIP-7702 authorization tuple to be signed by the device.
 */
export type EthereumSignAuth7702 = Static<typeof EthereumSignAuth7702>;
export const EthereumSignAuth7702 = Type.Object({
    path: DerivationPath,
    /** Chain id the authorization is valid on. `0` makes it valid on every EVM chain. */
    chainId: Type.Integer({ minimum: 0, maximum: Number.MAX_SAFE_INTEGER }),
    /**
     * Address of the contract the account delegates to. Authorizing the zero address
     * revokes an existing delegation.
     */
    delegate: Type.String(),
    /**
     * Account nonce the authorization is valid for. Both fields are `uint64` on the wire, but
     * are capped at `Number.MAX_SAFE_INTEGER` so a value JavaScript cannot represent exactly is
     * rejected instead of being silently rounded into a different authorization.
     */
    nonce: Type.Integer({ minimum: 0, maximum: Number.MAX_SAFE_INTEGER }),
});

/**
 * Signature of an EIP-7702 authorization tuple. Together with the `chainId`, `delegate`
 * and `nonce` that were signed it forms an entry of a transaction `authorizationList`.
 */
export type EthereumSignedAuth7702 = Static<typeof EthereumSignedAuth7702>;
export const EthereumSignedAuth7702 = Type.Object({
    /** Parity of the signature `y` coordinate, `0` or `1`. Legacy `v` is `yParity + 27`. */
    yParity: Type.Number(),
    r: Type.String(),
    s: Type.String(),
});

// ethereumSignMessage

export type EthereumSignMessage = Static<typeof EthereumSignMessage>;
export const EthereumSignMessage = Type.Object({
    path: DerivationPath,
    message: Type.String(),
    hex: Type.Optional(Type.Boolean()),
});

// ethereumSignTransaction

export type EthereumTransaction = Static<typeof EthereumTransaction>;
export const EthereumTransaction = Type.Object({
    to: Type.Union([Type.String(), Type.Null()]),
    value: Type.String(),
    gasPrice: Type.String(),
    gasLimit: Type.String(),
    maxFeePerGas: Type.Optional(Type.Undefined()),
    maxPriorityFeePerGas: Type.Optional(Type.Undefined()),
    nonce: Type.String(),
    data: Type.Optional(Type.String()),
    chainId: Type.Number(),
    txType: Type.Optional(Type.Number()),
    payment_req: Type.Optional(PROTO.PaymentRequest),
});

export type EthereumAccessList = Static<typeof EthereumAccessList>;
export const EthereumAccessList = Type.Object({
    address: Type.String(),
    storageKeys: Type.Array(Type.String()),
});

export type EthereumTransactionEIP1559 = Static<typeof EthereumTransactionEIP1559>;
export const EthereumTransactionEIP1559 = Type.Object({
    to: Type.Union([Type.String(), Type.Null()]),
    value: Type.String(),
    gasLimit: Type.String(),
    gasPrice: Type.Optional(Type.Undefined()),
    nonce: Type.String(),
    data: Type.Optional(Type.String()),
    chainId: Type.Number(),
    maxFeePerGas: Type.String(),
    maxPriorityFeePerGas: Type.String(),
    accessList: Type.Optional(Type.Array(EthereumAccessList)),
    payment_req: Type.Optional(PROTO.PaymentRequest),
});

export type EthereumSignTransaction = Static<typeof EthereumSignTransaction>;
export const EthereumSignTransaction = Type.Object({
    path: DerivationPath,
    transaction: Type.Union([EthereumTransaction, EthereumTransactionEIP1559]),
    chunkify: Type.Optional(Type.Boolean()),
});

export type EthereumSignedTx = Static<typeof EthereumSignedTx>;
export const EthereumSignedTx = Type.Object({
    v: Type.String(),
    r: Type.String(),
    s: Type.String(),
    serializedTx: Type.String(),
});

// ethereumSignTypedData

type EthereumSignTypedDataTypeProperty = Static<typeof EthereumSignTypedDataTypeProperty>;
const EthereumSignTypedDataTypeProperty = Type.Object({
    name: Type.String(),
    type: Type.String(),
});

export interface EthereumSignTypedDataTypes {
    EIP712Domain: EthereumSignTypedDataTypeProperty[];
    [additionalProperties: string]: EthereumSignTypedDataTypeProperty[];
}
export const EthereumSignTypedDataTypes = Type.Object(
    {
        EIP712Domain: Type.Array(EthereumSignTypedDataTypeProperty),
    },
    {
        additionalProperties: Type.Array(EthereumSignTypedDataTypeProperty),
    },
);

export interface EthereumSignTypedDataMessage<T extends EthereumSignTypedDataTypes> {
    types: T;
    primaryType: keyof T;
    domain: {
        name?: string;
        version?: string;
        chainId?: number | bigint | string;
        verifyingContract?: string;
        salt?: ArrayBuffer | string;
    };
    message: { [fieldName: string]: any };
}
export const EthereumSignTypedDataMessage = Type.Object({
    types: EthereumSignTypedDataTypes,
    primaryType: Type.String(),
    domain: Type.Object({
        name: Type.Optional(Type.String()),
        version: Type.Optional(Type.String()),
        // loosened to support string due to issue #10793
        chainId: Type.Optional(Type.Union([Type.Number(), Type.BigInt(), Type.String()])),
        verifyingContract: Type.Optional(Type.String()),
        salt: Type.Optional(Type.Union([Type.ArrayBuffer(), Type.String()])),
    }),
    message: Type.Object(
        {},
        {
            additionalProperties: Type.Any(),
        },
    ),
});

export interface EthereumSignTypedData<T extends EthereumSignTypedDataTypes> {
    path: DerivationPath;
    data: EthereumSignTypedDataMessage<T>;
    metamask_v4_compat: boolean;
    domain_separator_hash?: undefined;
    message_hash?: undefined;
    show_message_hash?: boolean;
}
export const EthereumSignTypedData = Type.Object({
    path: DerivationPath,
    data: EthereumSignTypedDataMessage,
    metamask_v4_compat: Type.Boolean(),
    domain_separator_hash: Type.Optional(Type.Undefined()),
    message_hash: Type.Optional(Type.Undefined()),
    show_message_hash: Type.Optional(Type.Boolean()),
});

/**
 * T1B1 cannot currently calculate EIP-712 hashes by itself,
 * so we have to precalculate them.
 * Used for full EIP-712 signing or blind signing.
 * Supports both T2T1 and T1B1.
 */
export interface EthereumSignTypedHash<T extends EthereumSignTypedDataTypes> {
    path: DerivationPath;
    data: EthereumSignTypedDataMessage<T>;
    metamask_v4_compat: boolean;
    domain_separator_hash: string;
    /** Not required for domain-only signing, when EIP712Domain is the `primaryType` */
    message_hash?: string;
    show_message_hash?: boolean;
}
export const EthereumSignTypedHash = Type.Object({
    path: DerivationPath,
    data: EthereumSignTypedDataMessage,
    metamask_v4_compat: Type.Boolean(),
    domain_separator_hash: Type.String(),
    message_hash: Type.Optional(Type.String()),
    show_message_hash: Type.Optional(Type.Boolean()),
});

// ethereumVerifyMessage

export type EthereumVerifyMessage = Static<typeof EthereumVerifyMessage>;
export const EthereumVerifyMessage = Type.Object({
    address: Type.String(),
    message: Type.String(),
    hex: Type.Optional(Type.Boolean()),
    signature: Type.String(),
});
