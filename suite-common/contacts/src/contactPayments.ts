import { BITCOIN_ONLY_SYMBOLS } from '@suite-common/suite-constants';
import {
    type SuiteSyncContact,
    type SuiteSyncContactAddress,
} from '@suite-common/suite-sync-storage';
import { type ContactOutputAttestation } from '@suite-common/wallet-core';
import { type Account, type WalletAccountTransaction } from '@suite-common/wallet-types';
import { type Result, err, ok } from '@trezor/type-utils';
import { isArrayMember } from '@trezor/utils';

import { verifyContactAttestation } from './contactAttestation';
import { decodeNpub } from './npub';

// m/purpose'/coin'/account'
const ACCOUNT_COIN_TYPE = /^m\/\d+'\/(\d+)'\//;

/** The SLIP-44 coin types of contact addresses: Bitcoin, and Testnet with Regtest. */
export const CONTACTS_SLIP44S: readonly number[] = [0, 1];

type ContactsAccount = Pick<Account, 'symbol' | 'networkType' | 'accountType' | 'path'>;

/**
 * The SLIP-44 coin type of the contact addresses the account pays or shares, or undefined for an
 * account without contact payments. Contacts are Bitcoin only, and a CoinJoin account has no
 * receive chain the Trezor attests.
 */
export const getContactsSlip44 = ({
    symbol,
    networkType,
    accountType,
    path,
}: ContactsAccount): number | undefined => {
    if (
        networkType !== 'bitcoin' ||
        accountType === 'coinjoin' ||
        !isArrayMember(symbol, BITCOIN_ONLY_SYMBOLS)
    ) {
        return undefined;
    }

    // The Trezor attests an address only on a path whose coin type is its network's SLIP-44.
    const coinType = ACCOUNT_COIN_TYPE.exec(`${path}/`)?.[1];

    return coinType === undefined ? undefined : Number(coinType);
};

/** Every address the account's transactions pay to, pending transactions included. */
export const getPaidAddresses = (
    transactions: readonly WalletAccountTransaction[],
): ReadonlySet<string> => {
    const paidAddresses = new Set<string>();

    for (const { targets, details } of transactions) {
        for (const output of [...targets, ...details.vout]) {
            output.addresses?.forEach(address => paidAddresses.add(address));
        }
    }

    return paidAddresses;
};

type IsContactAddressPaidParams = {
    contactAddress: SuiteSyncContactAddress;
    paidAddresses: ReadonlySet<string>;
};

/**
 * A contact address is paid once: the blockchain shows the account's own payments to every Suite
 * of the wallet at once, while the Suite Sync flag also covers payments from other accounts.
 */
const isContactAddressPaid = ({ contactAddress, paidAddresses }: IsContactAddressPaidParams) =>
    contactAddress.isSpent || paidAddresses.has(contactAddress.address);

const getContactAttestation = ({ npub, slip44, address, signature }: SuiteSyncContactAddress) => {
    const pubkey = decodeNpub(npub);

    if (!pubkey.success) {
        return undefined;
    }

    const attestation = { pubkey: pubkey.payload, slip44, address, signature };

    return verifyContactAttestation(attestation) ? attestation : undefined;
};

type ContactPaymentsParams = {
    /** The wallet's contacts; addresses of removed contacts are never paid to as such. */
    contacts: readonly SuiteSyncContact[];
    contactAddresses: readonly SuiteSyncContactAddress[];
    slip44: number;
    paidAddresses: ReadonlySet<string>;
};

export type PayableContact = {
    npub: string;
    name: string;
    /** Attested addresses nobody paid yet. */
    addresses: string[];
};

/** The contacts the account can pay, each with the attested addresses nobody paid yet. */
export const getPayableContacts = ({
    contacts,
    contactAddresses,
    slip44,
    paidAddresses,
}: ContactPaymentsParams): PayableContact[] =>
    contacts
        .map(({ npub, name }) => ({
            npub,
            name,
            addresses: contactAddresses
                .filter(
                    contactAddress =>
                        contactAddress.npub === npub &&
                        contactAddress.slip44 === slip44 &&
                        !isContactAddressPaid({ contactAddress, paidAddresses }) &&
                        getContactAttestation(contactAddress) !== undefined,
                )
                .map(({ address }) => address),
        }))
        .filter(contact => contact.addresses.length > 0);

type GetContactOutputsParams = ContactPaymentsParams & {
    outputAddresses: readonly string[];
};

/**
 * The attestations for the outputs that pay a contact address. An output with a contact address
 * nobody can vouch for is paid as a bare address; one that would pay a contact address a second
 * time is refused, because each payment to a contact goes to a new address.
 */
export const getContactOutputs = ({
    outputAddresses,
    contacts,
    contactAddresses,
    slip44,
    paidAddresses,
}: GetContactOutputsParams): Result<ContactOutputAttestation[], 'ContactAddressPaid'> => {
    const contactOutputs: ContactOutputAttestation[] = [];

    for (const outputAddress of outputAddresses) {
        const contactAddress = contactAddresses.find(
            ({ npub, address, slip44: addressSlip44 }) =>
                address === outputAddress &&
                addressSlip44 === slip44 &&
                contacts.some(contact => contact.npub === npub),
        );

        if (contactAddress === undefined) {
            continue;
        }

        if (isContactAddressPaid({ contactAddress, paidAddresses })) {
            return err('ContactAddressPaid');
        }

        const attestation = getContactAttestation(contactAddress);

        if (attestation !== undefined) {
            contactOutputs.push({
                address: outputAddress,
                contactPubkey: attestation.pubkey,
                contactSignature: attestation.signature,
            });
        }
    }

    return ok(contactOutputs);
};
