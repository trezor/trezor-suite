import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';

/**
 * SLIP-44 coin type from the coin segment of a BIP-43 path `m/purpose'/coin'/...`: Bitcoin mainnet
 * is 0, testnet and regtest are 1. Falls back to 0 only for an unparseable path.
 *
 * This is the single source of the coin of a contacts attestation or address. The attestation
 * content binds it, and the whole request, reply and spend flow keys on it to keep mainnet and
 * testnet strictly apart.
 */
export const slip44FromPath = (path: string): number => {
    const segment = path.split('/')[2];
    // parseInt stops at the hardening apostrophe, so "1'" parses as 1.
    const coinType = segment ? parseInt(segment, 10) : NaN;

    return Number.isInteger(coinType) && coinType >= 0 ? coinType : 0;
};

/**
 * Prefers the account's own path and falls back to the network's path template, so a testnet
 * account without a path never silently becomes mainnet.
 */
export const accountSlip44 = (account: Account): number =>
    slip44FromPath(account.path || getNetwork(account.symbol).bip43Path);

// The contacts exchange is Bitcoin-only, so only mainnet (0) and testnet (1) appear on the wire.
const CANONICAL_BITCOIN_SYMBOL: Record<number, NetworkSymbol> = { 0: 'btc', 1: 'test' };

/**
 * Whether a coin type belongs to the contacts exchange. Relay input with any other coin type is
 * ignored: it could never be served or paid, and every distinct value would open a new inbox row.
 */
export const isContactsSlip44 = (slip44: number): boolean =>
    Object.hasOwn(CANONICAL_BITCOIN_SYMBOL, slip44);

/**
 * Human network name for a coin type. Prefers the network of an account the user holds (a regtest
 * account names coin type 1 "Bitcoin Regtest"), and otherwise falls back to the canonical Bitcoin
 * network, so an address for a coin the user does not hold still carries a network name instead of
 * looking like a mainnet one. Undefined only for an unknown coin type.
 */
export const networkNameForSlip44 = (slip44: number, accounts: Account[]): string | undefined => {
    const matchingAccount = accounts.find(
        account => account.networkType === 'bitcoin' && accountSlip44(account) === slip44,
    );
    if (matchingAccount) return getNetwork(matchingAccount.symbol).name;

    const canonicalSymbol = CANONICAL_BITCOIN_SYMBOL[slip44];

    return canonicalSymbol ? getNetwork(canonicalSymbol).name : undefined;
};
