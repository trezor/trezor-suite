import { Translation } from '@suite/intl';
import { type ContactNameError, MAX_CONTACT_NAME_LENGTH } from '@suite-common/contacts';
import { exhaustive } from '@trezor/type-utils';

export type ContactNameErrorMessageProps = {
    reason: ContactNameError;
};

export const ContactNameErrorMessage = ({ reason }: ContactNameErrorMessageProps) => {
    switch (reason) {
        case 'Empty':
            return <Translation id="TR_CONTACTS_ERROR_NAME_EMPTY" />;
        case 'TooLong':
            return (
                <Translation
                    id="TR_CONTACTS_ERROR_NAME_TOO_LONG"
                    values={{ max: MAX_CONTACT_NAME_LENGTH }}
                />
            );
        case 'NotPlainAscii':
            return <Translation id="TR_CONTACTS_ERROR_NAME_NOT_PLAIN_ASCII" />;
        case 'SurroundingSpace':
            return <Translation id="TR_CONTACTS_ERROR_NAME_SURROUNDING_SPACE" />;
        default:
            return exhaustive(reason);
    }
};
