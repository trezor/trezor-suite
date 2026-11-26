import { MessagesSchema as PROTO } from '@trezor/protobuf';
import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import { CoinSymbolParam } from '../../coinInfo';
import type { Address as AddressShared, BundleableMethod } from '../../params';
import { GetAddress as GetAddressShared } from '../../params';

export type GetAddress = Static<typeof GetAddress>;
export const GetAddress = Type.Composite([
    GetAddressShared,
    Type.Object({
        coin: Type.Optional(CoinSymbolParam()),
        crossChain: Type.Optional(Type.Boolean()),
        multisig: Type.Optional(PROTO.MultisigRedeemScriptType),
        scriptType: Type.Optional(PROTO.InternalInputScriptType),
        unlockPath: Type.Optional(PROTO.UnlockPath),
        /**
         * Ask the device to attest the address it shows (`showOnTrezor` must stay true): after the
         * user confirms sharing it, the device signs it with the wallet's contact identity key.
         */
        contactAttestation: Type.Optional(Type.Boolean()),
    }),
]);

type Address = AddressShared & {
    /** BIP-340 signature over the address by `contactPubkey`, hex. Only with `contactAttestation`. */
    contactSignature?: string;
    /** The wallet's x-only contact identity public key (NIP-06, m/44'/1237'/0'/0/0), hex. */
    contactPubkey?: string;
};

export declare const getAddress: BundleableMethod<GetAddress, Address>;
