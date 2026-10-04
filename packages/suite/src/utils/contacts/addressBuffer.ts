import { type SharedAddress } from 'src/reducers/suite/contactsReducer';
import { type Attestation, verifyAttestation } from 'src/utils/contacts/attestation';

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

type IsFreshAttestationParams = {
    attestation: Attestation;
    slip44: number;
    spentContactAddresses: Record<string, boolean>;
};

/**
 * Whether I can pay to a contact's attested address in this coin: I have not paid to it yet, and
 * its signature still verifies, so a stored record is never trusted as is. The send form enables a
 * contact by this rule and getFreshContactAddressThunk hands out an address by it, so a contact
 * shown as payable always yields an address.
 */
export const isFreshAttestation = ({
    attestation,
    slip44,
    spentContactAddresses,
}: IsFreshAttestationParams): boolean =>
    attestation.slip44 === slip44 &&
    !spentContactAddresses[attestation.address] &&
    verifyAttestation(attestation, attestation.npub);
