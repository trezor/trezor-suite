import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_START_RECOVERY: {
        id: 'TR_START_RECOVERY',
        defaultMessage: 'Start recovery',
        description: 'Button.',
    },
    TR_CHECK_YOUR_DEVICE: {
        id: 'TR_CHECK_YOUR_DEVICE',
        defaultMessage: 'Check your device',
        description: 'Placeholder in seed input asking user to pay attention to his device',
    },
    TR_RECOVERY_ERROR: {
        id: 'TR_RECOVERY_ERROR',
        defaultMessage: 'Device recovery failed with error: {error}',
        description: 'Error during recovery. For example wrong word retyped or device disconnected',
    },
    TR_RECOVERY_SUCCESS: {
        id: 'TR_RECOVERY_SUCCESS',
        defaultMessage: 'Excellent, you recovered device from seed.',
        description: 'This is displayed upon successful recovery',
    },
});

export default definedMessages;
