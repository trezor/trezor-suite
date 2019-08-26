import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_FORGET_LABEL: {
        id: 'TR_FORGET_LABEL',
        defaultMessage: 'Forget {deviceLabel}?',
    },
    TR_PASSPHRASE_LABEL: {
        id: 'TR_PASSPHRASE_LABEL',
        defaultMessage: 'Enter "{deviceLabel}" passphrase',
    },
    TR_ACCOUNT_HASH: {
        id: 'TR_ACCOUNT_HASH',
        defaultMessage: 'Account #{number}',
        description: 'Used in auto-generated account label',
    },
});

export default definedMessages;
