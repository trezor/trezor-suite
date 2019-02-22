/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_ENTER_DEVICE_PASSPHRASE: {
        id: 'TR_ENTER_DEVICE_PASSPHRASE',
        defaultMessage: 'Enter {deviceLabel} passphrase',
    },
    TR_NOTE_COLON_PASSPHRASE: {
        id: 'TR_NOTE_COLON_PASSPHRASE',
        defaultMessage: 'Note: Passphrase is case-sensitive.',
    },
    TR_IF_YOU_FORGET_YOUR_PASSPHRASE_COMMA: {
        id: 'TR_IF_YOU_FORGET_YOUR_PASSPHRASE_COMMA',
        defaultMessage: 'If you forget your passphrase, your wallet is lost for good. There is no way to recover your funds.',
    },
    TR_CONFIRM_PASSPHRASE: {
        id: 'TR_CONFIRM_PASSPHRASE',
        defaultMessage: 'Confirm Passphrase',
    },
    TR_PASSPHRASES_DO_NOT_MATCH: {
        id: 'TR_PASSPHRASES_DO_NOT_MATCH',
        defaultMessage: 'Passphrases do not match!',
    },
    TR_SHOW_PASSPHRASE: {
        id: 'TR_SHOW_PASSPHRASE',
        defaultMessage: 'Show passphrase',
        description: 'This is on a passphrase button',
    },
    TR_ENTER: {
        id: 'TR_ENTER',
        defaultMessage: 'Enter',
    },
    TR_PASSPHRASE: {
        id: 'TR_PASSPHRASE',
        defaultMessage: 'Passphrase',
        description: 'Label above input',
    },
    TR_CHANGED_YOUR_MIND: {
        id: 'TR_CHANGED_YOUR_MIND',
        defaultMessage: 'Changed your mind? {TR_GO_TO_STANDARD_WALLET}',
    },
});

export default definedMessages;