import { convertXpub, xpubDerive } from '@trezor/connect-core/src/utils/hdnodeUtils';
import { type Result, err, ok } from '@trezor/type-utils';
import { bip32 } from '@trezor/utxo-lib';

import type { DeviceCall, DeviceCallError } from './deviceSession';
import { ACCOUNT_TYPE_DEFINITIONS, type AccountType, getAccountPath } from '../bitcoin/accountType';
import { BITCOIN_NETWORK } from '../bitcoin/bitcoinNetwork';

export type DiscoveredAccount = {
    accountType: AccountType;
    accountIndex: number;
    path: number[];
    /**
     * Account public key serialized on the host with the plain `xpub` prefix. It is the anchor
     * for local address derivation and for the comparison made right before signing.
     */
    xpub: string;
    /** The same key with the prefix blockbook needs to derive this account type's addresses. */
    descriptor: string;
};

export type AccountPublicKeyError =
    | DeviceCallError
    /** The key material returned by the device is inconsistent or not the requested node. */
    | { type: 'public-key-invalid' };

const VERIFICATION_CHILD_INDEX = 0;

export type GetAccountPublicKeyParams = {
    call: DeviceCall;
    accountType: AccountType;
    accountIndex: number;
};

/**
 * Reads an account public key from the device and rebuilds its serialization on the host.
 *
 * The firmware in scope always answers with the `xpub` prefix, whatever the account type, so
 * the prefix it reports is never used. The key is rebuilt from the raw node, cross-checked
 * against a child key requested separately, and then re-serialized with the correct prefix.
 */
export const getAccountPublicKey = async ({
    call,
    accountType,
    accountIndex,
}: GetAccountPublicKeyParams): Promise<Result<DiscoveredAccount, AccountPublicKeyError>> => {
    const path = getAccountPath(accountType, accountIndex);

    const accountKey = await call('GetPublicKey', 'PublicKey', { address_n: path });
    if (!accountKey.success) return accountKey;

    const childKey = await call('GetPublicKey', 'PublicKey', {
        address_n: [...path, VERIFICATION_CHILD_INDEX],
    });
    if (!childKey.success) return childKey;

    try {
        // Throws unless the serialized key matches the raw node and the child key is the one
        // the account key derives, which rules out a mangled or substituted response.
        const verifiedKey = xpubDerive(
            accountKey.payload.message,
            childKey.payload.message,
            VERIFICATION_CHILD_INDEX,
            BITCOIN_NETWORK,
        );
        const xpub = convertXpub(verifiedKey.xpub, BITCOIN_NETWORK);

        const node = bip32.fromBase58(xpub, BITCOIN_NETWORK);
        if (node.depth !== path.length || node.index !== path.at(-1)) {
            return err({ type: 'public-key-invalid' });
        }

        const { descriptorNetwork } = ACCOUNT_TYPE_DEFINITIONS[accountType];

        return ok({
            accountType,
            accountIndex,
            path,
            xpub,
            descriptor: convertXpub(xpub, BITCOIN_NETWORK, descriptorNetwork),
        });
    } catch {
        return err({ type: 'public-key-invalid' });
    }
};
