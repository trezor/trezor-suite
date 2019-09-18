import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_RECONNECT_HEADER: {
        id: 'TR_RECONNECT_HEADER',
        defaultMessage: 'Reconnect your device',
    },
    TR_RECONNECT_TEXT: {
        id: 'TR_RECONNECT_TEXT',
        defaultMessage: 'We lost connection with your device. This might mean:',
    },
    TR_RECONNECT_TROUBLESHOOT_CABEL: {
        id: 'TR_RECONNECT_TROUBLESHOOT_CABEL',
        defaultMessage: 'Cable is broken, try another one',
        description: '',
    },
    TR_RECONNECT_TROUBLESHOOT_CONNECTION: {
        id: 'TR_RECONNECT_TROUBLESHOOT_CONNECTION',
        defaultMessage: 'Device is not well connected to the cable',
        description: '',
    },
    TR_RECONNECT_TROUBLESHOOT_BRIDGE: {
        id: 'TR_RECONNECT_TROUBLESHOOT_BRIDGE',
        defaultMessage: 'Trezor bridge might have stopped working, try restarting',
        description: '',
    },
});

export default definedMessages;
