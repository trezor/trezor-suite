/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_NEM_WALLET: {
        id: 'TR_NEM_WALLET',
        defaultMessage: 'NEM wallet',
    },
    TR_WE_HAVE_PARTNERED_UP_WITH_THE_NEM: {
        id: 'TR_WE_HAVE_PARTNERED_UP_WITH_THE_NEM',
        defaultMessage: 'We have partnered up with the NEM Foundation to provide you with a full-fledged NEM Wallet.',
    },
    TR_MAKE_SURE_YOU_DOWNLOAD_THE_UNIVERSAL: {
        id: 'TR_MAKE_SURE_YOU_DOWNLOAD_THE_UNIVERSAL',
        defaultMessage: 'Make sure you download the Universal Client for Trezor support.',
    },
    TR_GO_TO_NEM_DOT_IO: {
        id: 'TR_GO_TO_NEM_DOT_IO',
        defaultMessage: 'Go to nem.io',
    },
});

export default definedMessages;