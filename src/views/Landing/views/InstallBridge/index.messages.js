/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_NEW_COMMUNICATION_TOOL: {
        id: 'TR_NEW_COMMUNICATION_TOOL',
        defaultMessage: 'New communication tool to facilitate the connection between your Trezor and your internet browser.',
    },
    TR_DOWNLOAD_LATEST_BRIDGE: {
        id: 'TR_DOWNLOAD_LATEST_BRIDGE',
        defaultMessage: 'Download latest Bridge {version}',
    },
    TR_LEARN_MORE_ABOUT_LATEST_VERSION: {
        id: 'TR_LEARN_MORE_ABOUT_LATEST_VERSION',
        defaultMessage: 'Learn more about latest version in {TR_CHANGELOG}.',
    },
    TR_CHANGELOG: {
        id: 'TR_CHANGELOG',
        defaultMessage: 'Changelog',
        description: 'Part of the sentence: Learn more about latest version in {TR_CHANGELOG}.',
    },
    TR_CHECK_PGP_SIGNATURE: {
        id: 'TR_CHECK_PGP_SIGNATURE',
        defaultMessage: 'Check PGP signature',
    },
    TR_DONT_UPGRADE_BRIDGE: {
        id: 'TR_DONT_UPGRADE_BRIDGE',
        defaultMessage: 'No, I don\'t want to upgrade Bridge now',
    },
    TR_TAKE_ME_BACK_TO_WALLET: {
        id: 'TR_TAKE_ME_BACK_TO_WALLET',
        defaultMessage: 'Take me back to the wallet',
    },
});

export default definedMessages;