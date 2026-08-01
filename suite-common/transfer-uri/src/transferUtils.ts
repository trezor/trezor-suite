import { type NetworkSymbol } from '@suite-common/wallet-config';
import type { Protocol } from '@trezor/network-module-suite-common-types';
import { type Result } from '@trezor/type-utils';

type BaseTransferUriInfo = {
    scheme: Protocol;
    address: string;
};

export type BipTransferUriInfo = BaseTransferUriInfo & {
    format: 'bip321';
    amount?: string;
    label?: string;
    message?: string;
};

export type ErcTransferUriInfo = BaseTransferUriInfo & {
    format: 'erc681';
    networkSymbol?: NetworkSymbol; // network resolved from the @chainId; undefined when not specified
    token?: string;
    tokenAmount?: string;
};

export type TransferUriInfo = BipTransferUriInfo | ErcTransferUriInfo;

export type TransferUriError =
    | { type: 'INVALID_URI' } // not a URI, or a malformed one (e.g. a plain address, a repeated param)
    | { type: 'MISSING_ADDRESS' } // valid scheme but no address present
    | { type: 'UNKNOWN_SCHEME'; scheme: string }; // not a recognized crypto protocol

export type TransferUriResult = Result<TransferUriInfo, TransferUriError>;

/** Whether a decoded transfer URI carries a spendable amount (native amount or token amount). */
export const isAmountPresent = (info: TransferUriInfo): boolean =>
    (info.format === 'bip321' && info.amount !== undefined) ||
    (info.format === 'erc681' && info.tokenAmount !== undefined);
