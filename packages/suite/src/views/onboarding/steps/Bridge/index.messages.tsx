import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_BRIDGE_HEADING: {
        id: 'TR_BRIDGE_HEADING',
        defaultMessage: 'Trezor Bridge',
        description: 'Heading on bridge page',
    },
    TR_BRIDGE_SUBHEADING: {
        id: 'TR_BRIDGE_SUBHEADING',
        defaultMessage:
            'Trezor Bridge is a communication tool to facilitate the connection between your Trezor and your internet browser.',
        description: 'Description what Trezor Bridge is',
    },
    TR_DOWNLOAD: {
        id: 'TR_DOWNLOAD',
        defaultMessage: 'Download',
        description: 'Download button',
    },
    TR_BRIDGE_IS_RUNNING: {
        id: 'TR_BRIDGE_IS_RUNNING',
        defaultMessage: 'Trezor bridge is up and running',
        description: 'Text that indicates that browser can communicate with Trezor Bridge.',
    },
    TR_DETECTING_BRIDGE: {
        id: 'TR_DETECTING_BRIDGE',
        defaultMessage: 'Detecting Trezor Bridge instalation',
        description: 'Message to show after user clicks download bridge.',
    },
    TR_NOT_RUNNING: {
        id: 'TR_NOT_RUNNING',
        defaultMessage: 'not running',
        description: 'Bridge status in box next to heading',
    },
    TR_WAIT_FOR_FILE_TO_DOWNLOAD: {
        id: 'TR_WAIT_FOR_FILE_TO_DOWNLOAD',
        defaultMessage: 'Wait for file to download',
        description: 'Instruction for installing Trezor Bridge',
    },
    TR_DOUBLE_CLICK_IT_TO_RUN_INSTALLER: {
        id: 'TR_DOUBLE_CLICK_IT_TO_RUN_INSTALLER',
        defaultMessage: 'Double click it to run installer',
        description: 'Instruction for installing Trezor Bridge',
    },
    TR_CHECK_PGP_SIGNATURE: {
        id: 'TR_CHECK_PGP_SIGNATURE',
        defaultMessage: 'Check PGP signature (optional)',
        description: 'Instruction for installing Trezor Bridge',
    },
    TR_TREZOR_BRIDGE_IS_NOT_RUNNING: {
        id: 'TR_TREZOR_BRIDGE_IS_NOT_RUNNING',
        defaultMessage: 'Trezor Bridge is not running',
        description: '',
    },
    TR_TREZOR_BRIDGE_IS_RUNNING_VERSION: {
        id: 'TR_TREZOR_BRIDGE_IS_RUNNING_VERSION',
        defaultMessage: 'Trezor Bridge is running. Version: {version}',
        description: '',
    },
});

export default definedMessages;
