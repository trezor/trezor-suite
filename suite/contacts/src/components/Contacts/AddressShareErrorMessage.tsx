import { Translation } from '@suite/intl';
import { type ContactAddressShareError } from '@suite-common/contacts';
import { exhaustive } from '@trezor/type-utils';

export type AddressShareErrorMessageProps = {
    reason: ContactAddressShareError | 'UnsupportedNetwork';
};

export const AddressShareErrorMessage = ({ reason }: AddressShareErrorMessageProps) => {
    switch (reason) {
        case 'NotAnAddressShare':
            return <Translation id="TR_CONTACTS_ERROR_INVALID_SHARE" />;
        case 'InvalidAttestation':
            return <Translation id="TR_CONTACTS_ERROR_INVALID_ATTESTATION" />;
        case 'NpubMismatch':
            return <Translation id="TR_CONTACTS_ERROR_NPUB_MISMATCH" />;
        case 'UnsupportedNetwork':
            return <Translation id="TR_CONTACTS_ERROR_UNSUPPORTED_NETWORK" />;
        default:
            return exhaustive(reason);
    }
};
