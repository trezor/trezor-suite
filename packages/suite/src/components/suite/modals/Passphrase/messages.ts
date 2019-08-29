import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    PASSPHRASE_CASE_SENSITIVE: {
        id: 'PASSPHRASE_CASE_SENSITIVE',
        defaultMessage: 'Note: Passphrase is case-sensitive.',
    },
    PASSPHRASE_BLANK: {
        id: 'PASSPHRASE_BLANK',
        defaultMessage: 'Leave passphrase blank to access your default wallet',
    },
    PASSPHRASE_DO_NOT_MATCH: {
        id: 'PASSPHRASE_DO_NOT_MATCH',
        defaultMessage: 'Passphrases do not match!',
    },
    TR_ENTER_PASSPHRASE: {
        id: 'TR_ENTER_PASSPHRASE',
        defaultMessage: 'Enter',
    },
});

export default definedMessages;
