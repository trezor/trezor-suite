import { StrKey, xdr } from '@stellar/stellar-sdk';

import type { StellarTrustline } from '../../types/account';

/** The native-balance half of an `AccountEntry`, with every amount in stroops. */
export interface DecodedAccountEntry {
    balance: string;
    sequence: string;
    numSubEntries: number;
    numSponsoring: number;
    numSponsored: number;
    sellingLiabilities: string;
}

export interface DecodedLedgerHeader {
    baseReserve: string;
    baseFee: string;
    ledgerVersion: number;
}

const NO_EXTENSIONS = { sellingLiabilities: '0', numSponsoring: 0, numSponsored: 0 };

// Liabilities live in the v1 extension and the sponsorship counters in the v2 extension nested
// inside it. Accounts that never needed either carry neither, so each level is gated on its own
// discriminant before its arm is read.
const decodeAccountExtensions = (entry: xdr.AccountEntry) => {
    const { ext } = entry;

    if (ext.type !== 'v1') {
        return NO_EXTENSIONS;
    }

    const { v1 } = ext;
    const sellingLiabilities = v1.liabilities.selling.toString();
    const v1Ext = v1.ext;

    if (v1Ext.type !== 'v2') {
        return { ...NO_EXTENSIONS, sellingLiabilities };
    }

    const { v2 } = v1Ext;

    return {
        sellingLiabilities,
        numSponsoring: v2.numSponsoring,
        numSponsored: v2.numSponsored,
    };
};

export const decodeAccountEntry = (data: xdr.LedgerEntryData): DecodedAccountEntry | undefined => {
    if (data.type !== 'account') {
        return undefined;
    }

    const entry = data.account;

    return {
        balance: entry.balance.toString(),
        sequence: entry.seqNum.toString(),
        numSubEntries: entry.numSubEntries,
        ...decodeAccountExtensions(entry),
    };
};

// Asset codes are fixed-width and zero-padded on the wire. Cut at the first NUL rather than
// trimming with `/\0+$/`, which backtracks over the padding and so scans the code quadratically.
const decodeAssetCode = (assetCode: string | Buffer) => {
    const code = typeof assetCode === 'string' ? assetCode : assetCode.toString('utf8');
    const padding = code.indexOf('\0');

    return padding === -1 ? code : code.slice(0, padding);
};

export const decodeTrustlineEntry = (data: xdr.LedgerEntryData): StellarTrustline | undefined => {
    // The union arm is spelled `trustline` while its accessor is `trustLine`; mismatching the
    // two silently drops every trustline instead of failing.
    if (data.type !== 'trustline') {
        return undefined;
    }

    const entry = data.trustLine;
    const { asset } = entry;

    // Liquidity-pool shares are trustlines as well, but they are not an asset Suite can render.
    if (asset.type === 'assetTypeCreditAlphanum4') {
        return {
            assetCode: decodeAssetCode(Buffer.from(asset.alphaNum4.assetCode.value)),
            assetIssuer: StrKey.encodeEd25519PublicKey(asset.alphaNum4.issuer.ed25519.value),
            balance: entry.balance.toString(),
        };
    }

    if (asset.type === 'assetTypeCreditAlphanum12') {
        return {
            assetCode: decodeAssetCode(Buffer.from(asset.alphaNum12.assetCode.value)),
            assetIssuer: StrKey.encodeEd25519PublicKey(asset.alphaNum12.issuer.ed25519.value),
            balance: entry.balance.toString(),
        };
    }

    return undefined;
};

export const decodeLedgerHeader = (headerXdr: string): DecodedLedgerHeader => {
    const header = xdr.LedgerHeader.fromXdr(headerXdr, 'base64');

    return {
        baseReserve: header.baseReserve.toString(),
        baseFee: header.baseFee.toString(),
        ledgerVersion: header.ledgerVersion,
    };
};
