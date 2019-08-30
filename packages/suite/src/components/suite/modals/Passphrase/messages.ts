import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_PASSPHRASE_CASE_SENSITIVE: {
        id: 'PASSPHRASE_CASE_SENSITIVE',
        defaultMessage: 'Note: Passphrase is case-sensitive.',
    },
    TR_PASSPHRASE_BLANK: {
        id: 'PASSPHRASE_BLANK',
        defaultMessage: 'Leave passphrase blank to access your default wallet',
    },
    TR_PASSPHRASE_DO_NOT_MATCH: {
        id: 'PASSPHRASE_DO_NOT_MATCH',
        defaultMessage: 'Passphrases do not match!',
    },
    TR_ENTER_PASSPHRASE: {
        id: 'TR_ENTER_PASSPHRASE',
        defaultMessage: 'Enter',
    },
    TR_SHOW_PASSPHRASE: {
        id: 'TR_SHOW_PASSPHRASE',
        defaultMessage: 'Show passphrase',
    },
});

export default definedMessages;
