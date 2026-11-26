import { Translation } from '@suite/intl';
import { type ContactsError } from '@suite-common/contacts';
import { exhaustive } from '@trezor/type-utils';

import { ContactNameErrorMessage } from './ContactNameErrorMessage';

export type ContactsErrorMessageProps = {
    error: ContactsError;
};

export const ContactsErrorMessage = ({ error }: ContactsErrorMessageProps) => {
    switch (error.type) {
        case 'NoDevice':
            return <Translation id="TR_CONTACTS_ERROR_NO_DEVICE" />;
        case 'PassphraseWallet':
            return <Translation id="TR_CONTACTS_PASSPHRASE_WALLET" />;
        case 'InvalidNpub':
            return <Translation id="TR_CONTACTS_ERROR_INVALID_NPUB" />;
        case 'OwnNpub':
            return <Translation id="TR_CONTACTS_ERROR_OWN_NPUB" />;
        case 'DuplicateContact':
            return <Translation id="TR_CONTACTS_ERROR_DUPLICATE" />;
        case 'UnknownContact':
            return <Translation id="TR_CONTACTS_ERROR_UNKNOWN" />;
        case 'InvalidName':
            return <ContactNameErrorMessage reason={error.reason} />;
        case 'Cancelled':
            return <Translation id="TR_CONTACTS_ERROR_CANCELLED" />;
        case 'WalletChanged':
            return <Translation id="TR_CONTACTS_ERROR_WALLET_CHANGED" />;
        case 'WardConflict':
            return <Translation id="TR_CONTACTS_ERROR_WARD_CONFLICT" />;
        case 'WardFailed':
            return (
                <Translation
                    id="TR_CONTACTS_ERROR_WARD_FAILED"
                    values={{ message: error.message }}
                />
            );
        case 'DeviceFailed':
            return (
                <Translation
                    id="TR_CONTACTS_ERROR_DEVICE_FAILED"
                    values={{ message: error.message }}
                />
            );
        case 'SuiteSyncFailed':
            return <Translation id="TR_CONTACTS_ERROR_SUITE_SYNC_FAILED" />;
        default:
            return exhaustive(error);
    }
};
