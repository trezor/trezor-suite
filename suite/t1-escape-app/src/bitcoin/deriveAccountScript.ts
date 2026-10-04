import { type Result, err, ok } from '@trezor/type-utils';
import { type BIP32Interface, bip32, payments } from '@trezor/utxo-lib';

import { type AccountType, isHardened } from './accountType';
import { BITCOIN_NETWORK } from './bitcoinNetwork';

export type AccountScriptError = 'invalid-xpub' | 'invalid-address-path' | 'derivation-failed';

const RECEIVE_CHAIN = 0;
const CHANGE_CHAIN = 1;

export const parseAccountXpub = (xpub: string): Result<BIP32Interface, AccountScriptError> => {
    try {
        return ok(bip32.fromBase58(xpub, BITCOIN_NETWORK));
    } catch {
        return err('invalid-xpub');
    }
};

const getScript = (accountType: AccountType, pubkey: Buffer) => {
    switch (accountType) {
        case 'p2pkh':
            return payments.p2pkh({ pubkey, network: BITCOIN_NETWORK }).output;
        case 'p2sh':
            return payments.p2sh({
                redeem: payments.p2wpkh({ pubkey, network: BITCOIN_NETWORK }),
                network: BITCOIN_NETWORK,
            }).output;
        case 'p2wpkh':
            return payments.p2wpkh({ pubkey, network: BITCOIN_NETWORK }).output;
        // no default
    }
};

export type DeriveAccountScriptParams = {
    accountNode: BIP32Interface;
    accountType: AccountType;
    /** The two path components below the account: chain (0 receive, 1 change) and index. */
    chain: number;
    addressIndex: number;
};

/**
 * Derives, on the host and from the account public key alone, the output script the device
 * would sign for at `account / chain / addressIndex` with the script type of the account.
 */
export const deriveAccountScript = ({
    accountNode,
    accountType,
    chain,
    addressIndex,
}: DeriveAccountScriptParams): Result<Buffer, AccountScriptError> => {
    const isChainValid = chain === RECEIVE_CHAIN || chain === CHANGE_CHAIN;
    const isIndexValid =
        Number.isInteger(addressIndex) && addressIndex >= 0 && !isHardened(addressIndex);

    if (!isChainValid || !isIndexValid) return err('invalid-address-path');

    try {
        const { publicKey } = accountNode.derive(chain).derive(addressIndex);
        const script = getScript(accountType, publicKey);

        return script ? ok(script) : err('derivation-failed');
    } catch {
        return err('derivation-failed');
    }
};
