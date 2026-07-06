// Destination marshaling: a recipient address + amount -> the MoneroTransactionDestinationEntry
// shape moneroSignTransaction expects.
import { parseMoneroAddress } from './address';
import { bytesToHex } from './hex';

export interface DestinationEntry {
    amount: number;
    addr: { spend_public_key: string; view_public_key: string };
    is_subaddress: boolean;
    original: string;
    is_integrated: boolean;
}

export const buildDestination = (address: string, amount: number): DestinationEntry => {
    const parsed = parseMoneroAddress(address);

    return {
        amount,
        addr: {
            spend_public_key: bytesToHex(parsed.spendPublicKey),
            view_public_key: bytesToHex(parsed.viewPublicKey),
        },
        is_subaddress: parsed.isSubaddress,
        original: address,
        is_integrated: parsed.paymentId !== undefined,
    };
};
