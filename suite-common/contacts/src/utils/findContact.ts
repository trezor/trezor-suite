import TrezorConnect from '@trezor/connect';

import { Contact } from '../types';

export const findContactBySignedMessage = async (
    contacts: Contact[],
    address: string,
    signature: string,
) => {
    for (const contact of contacts) {
        try {
            // I thought this would work better but it still doesn't...
            const response = await TrezorConnect.verifyMessage({
                address: contact.address,
                message: address,
                signature: Buffer.from(signature, 'hex').toString('base64'),
                coin: 'test',
            });

            if (response.success) {
                return contact;
            }
        } catch {
            continue;
        }
    }
};
