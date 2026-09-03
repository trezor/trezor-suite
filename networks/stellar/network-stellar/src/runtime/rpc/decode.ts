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
// inside it. Accounts that never needed either carry neither, and the accessors throw instead
// of returning undefined, so each level is gated on its own discriminant.
const decodeAccountExtensions = (entry: xdr.AccountEntry) => {
    if (entry.ext().switch() !== 1) {
        return NO_EXTENSIONS;
    }

    const v1 = entry.ext().v1();
    const sellingLiabilities = v1.liabilities().selling().toString();

    if (v1.ext().switch() !== 2) {
        return { ...NO_EXTENSIONS, sellingLiabilities };
    }

    const v2 = v1.ext().v2();

    return {
        sellingLiabilities,
        numSponsoring: v2.numSponsoring(),
        numSponsored: v2.numSponsored(),
    };
};

export const decodeAccountEntry = (data: xdr.LedgerEntryData): DecodedAccountEntry | undefined => {
    if (data.switch().name !== 'account') {
        return undefined;
    }

    const entry = data.account();

    return {
        balance: entry.balance().toString(),
        sequence: entry.seqNum().toString(),
        numSubEntries: entry.numSubEntries(),
        ...decodeAccountExtensions(entry),
    };
};

// Asset codes are fixed-width and zero-padded on the wire.
const decodeAssetCode = (assetCode: string | Buffer) =>
    (typeof assetCode === 'string' ? assetCode : assetCode.toString('utf8')).replace(/\0+$/, '');

export const decodeTrustlineEntry = (data: xdr.LedgerEntryData): StellarTrustline | undefined => {
    // The union arm is spelled `trustline` while its accessor is `trustLine`; mismatching the
    // two silently drops every trustline instead of failing.
    if (data.switch().name !== 'trustline') {
        return undefined;
    }

    const entry = data.trustLine();
    const asset = entry.asset();

    // Liquidity-pool shares are trustlines as well, but they are not an asset Suite can render.
    if (asset.switch().name === 'assetTypeCreditAlphanum4') {
        return {
            assetCode: decodeAssetCode(asset.alphaNum4().assetCode()),
            assetIssuer: StrKey.encodeEd25519PublicKey(asset.alphaNum4().issuer().ed25519()),
            balance: entry.balance().toString(),
        };
    }

    if (asset.switch().name === 'assetTypeCreditAlphanum12') {
        return {
            assetCode: decodeAssetCode(asset.alphaNum12().assetCode()),
            assetIssuer: StrKey.encodeEd25519PublicKey(asset.alphaNum12().issuer().ed25519()),
            balance: entry.balance().toString(),
        };
    }

    return undefined;
};

export const decodeLedgerHeader = (headerXdr: string): DecodedLedgerHeader => {
    const header = xdr.LedgerHeader.fromXDR(headerXdr, 'base64');

    return {
        baseReserve: header.baseReserve().toString(),
        baseFee: header.baseFee().toString(),
        ledgerVersion: header.ledgerVersion(),
    };
};
