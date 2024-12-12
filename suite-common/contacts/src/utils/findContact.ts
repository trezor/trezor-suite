import { secp256k1 } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';

import { Contact } from '../types';

export const findContactBySignedMessage = (
    contacts: Contact[],
    address: string,
    signature: string,
) => {
    let recover;
    try {
        // same logic as on fw side
        const messageDigest = sha256(address);
        let recId = Buffer.from(signature.slice(0, 2), 'hex')[0];
        recId -= 27;
        recId &= 3;

        recover = secp256k1.Signature.fromCompact(Buffer.from(signature.slice(2), 'hex'))
            .addRecoveryBit(recId)
            .recoverPublicKey(messageDigest)
            .toHex();
    } catch (error) {
        console.error(error);

        return;
    }

    return contacts.find(c => c.address === recover.slice(2));
};
