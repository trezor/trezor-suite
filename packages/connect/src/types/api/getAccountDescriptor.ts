import { Static, Type } from '@trezor/schema-utils';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Params, BundledParams, Response, DerivationPath } from '../params';

export type GetAccountDescriptorParams = Static<typeof GetAccountDescriptorParams>;
export const GetAccountDescriptorParams = Type.Object({
    path: DerivationPath,
    coin: Type.String(),
    derivationType: Type.Optional(PROTO.EnumCardanoDerivationType),
    suppressBackupWarning: Type.Optional(Type.Boolean()),
});

export interface GetAccountDescriptorResponse {
    descriptor: string;
    path: string;
    legacyXpub?: string; // bitcoin-like descriptor in legacy format (xpub) used by labeling (metadata)
}

export declare function getAccountDescriptor(
    params: Params<GetAccountDescriptorParams>,
): Response<GetAccountDescriptorResponse>;
export declare function getAccountDescriptor(
    params: BundledParams<GetAccountDescriptorParams>,
): Response<(GetAccountDescriptorResponse | null)[]>;
