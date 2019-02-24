/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_DONT_FORGET: {
        id: 'TR_DONT_FORGET',
        defaultMessage: 'Don\'t forget',
        description: 'Button in remember/forget dialog',
    },
    TR_FORGETTING_ONLY_REMOVES_THE_DEVICE_FROM: {
        id: 'TR_FORGETTING_ONLY_REMOVES_THE_DEVICE_FROM',
        defaultMessage: 'Forgetting only removes the device from the list on the left, your coins are still safe and you can access them by reconnecting your Trezor again.',
    },
});

export default definedMessages;