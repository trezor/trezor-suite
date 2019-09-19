import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_ADD_NEW_ACCOUNT: {
        id: 'TR_ADD_NEW_ACCOUNT',
        defaultMessage: 'Add new account',
    },
    TR_ENABLE_NETWORK: {
        id: 'TR_ENABLE_NETWORK',
        defaultMessage:
            '{networkName} is disabled.\nTODO: add more text about enabling networks in wallet settings',
    },
    TR_ENABLE_NETWORK_BUTTON: {
        id: 'TR_ENABLE_NETWORK_BUTTON',
        defaultMessage: 'Find my {networkName} accounts',
    },
});

export default definedMessages;
