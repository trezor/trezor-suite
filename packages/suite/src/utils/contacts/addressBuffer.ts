import { type SharedAddress } from 'src/reducers/suite/contactsReducer';
import { type Attestation } from 'src/utils/contacts/attestation';

/**
 * One row of a contact's address buffer: either their address I can pay to, or my address I shared
 * with them. Flattened from the reducer records to what the view renders.
 */
export type AddressEntry = {
    address: string;
    isUsed: boolean;
    createdAt: number;
    slip44: number;
};

/** Unused entries first, then newest first. Returns a new array. */
export const sortAddressEntries = (entries: AddressEntry[]): AddressEntry[] =>
    [...entries].sort((a, b) => Number(a.isUsed) - Number(b.isUsed) || b.createdAt - a.createdAt);

/** Their addresses I can pay to, marked used once I paid to them. */
export const inboundAddressEntries = (
    verifiedAddresses: Record<string, Attestation>,
    spent: Record<string, boolean>,
    paymentNpub: string,
): AddressEntry[] =>
    Object.values(verifiedAddresses)
        .filter(attestation => attestation.npub === paymentNpub)
        .map(attestation => ({
            address: attestation.address,
            isUsed: Boolean(spent[attestation.address]),
            createdAt: attestation.createdAt,
            slip44: attestation.slip44,
        }));

/** My addresses I shared with them, marked used once they were used on-chain. */
export const outboundAddressEntries = (
    sharedAddresses: Record<string, SharedAddress>,
    spent: Record<string, boolean>,
    paymentNpub: string,
): AddressEntry[] =>
    Object.values(sharedAddresses)
        .filter(shared => shared.npub === paymentNpub)
        .map(shared => ({
            address: shared.attestation.address,
            isUsed: Boolean(spent[shared.attestation.address]),
            createdAt: shared.sharedAt,
            slip44: shared.attestation.slip44,
        }));
