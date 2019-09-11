import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_CREATE_NEW_INSTANCE: {
        id: 'TR_CREATE_NEW_INSTANCE',
        defaultMessage: 'Create new instance',
    },
    TR_INSTANCE_NAME_IN_USE: {
        id: 'TR_INSTANCE_NAME_IN_USE',
        defaultMessage: 'Instance name is already in use',
    },
    TR_INSTANCE_NAME: {
        id: 'TR_INSTANCE_NAME',
        defaultMessage: 'Instance name',
    },
    TR_THIS_WILL_CREATE_NEW_INSTANCE: {
        id: 'TR_THIS_WILL_CREATE_NEW_INSTANCE',
        defaultMessage:
            'This will create new instance of device which can be used with different passphrase',
    },
    TR_CLONE: {
        id: 'TR_CLONE',
        defaultMessage: 'Clone "{deviceLabel}"?',
    },
});

export default definedMessages;
