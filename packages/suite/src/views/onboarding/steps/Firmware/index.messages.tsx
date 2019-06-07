import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_FIRMWARE_HEADING: {
        id: 'TR_FIRMWARE_HEADING',
        defaultMessage: 'Get the latest firmware',
        description: 'Heading on firmware page',
    },
    TR_FIRMWARE_SUBHEADING: {
        id: 'TR_FIRMWARE_SUBHEADING',
        defaultMessage:
            'Your Trezor is shipped without firmware installed to ensure that you can get started with the latest features right away. The authenticity of the installed firmware is always checked during device start. If the firmware is not correctly signed by SatoshiLabs, your Trezor will display a warning.',
        description: 'Main text on firmware page for devices without firmware.',
    },
    TR_INSTALL: {
        id: 'TR_INSTALL',
        defaultMessage: 'Install',
        description: 'Install button',
    },
    TR_INSTALLING: {
        id: 'TR_INSTALLING',
        defaultMessage: 'Do not disconnect your device. Installing',
        description: 'Message that is visible when installing process is in progress.',
    },
    TR_INSTALL_ERROR_OCCURRED: {
        id: 'TR_INSTALL_ERROR_OCCURRED',
        defaultMessage: 'Error occurred during firmware install: {error}',
        description: 'Error message when installing firmware to device',
    },
    TR_FETCH_ERROR_OCCURRED: {
        id: 'TR_FETCH_ERROR_OCCURRED',
        defaultMessage: 'Error occured during firmware download: {error}',
        description: 'Error message when downloading firmware',
    },
    TR_FIRMWARE_INSTALLED: {
        id: 'TR_FIRMWARE_INSTALLED',
        defaultMessage: 'Perfect. The newest firmware is installed. Time to continue',
        description: 'Message to display in case firmware is installed',
    },
    TR_CONNECT_YOUR_DEVICE_AGAIN: {
        id: 'TR_CONNECT_YOUR_DEVICE_AGAIN',
        defaultMessage: 'Connect your device again',
        description: 'Prompt to connect device.',
    },
    TR_DISCONNECT_YOUR_DEVICE: {
        id: 'TR_DISCONNECT_YOUR_DEVICE',
        defaultMessage: 'Disconnect your device',
        description: 'Prompt to disconnect device.',
    },
    TR_WAIT_FOR_REBOOT: {
        id: 'TR_WAIT_FOR_REBOOT',
        defaultMessage: 'Wait for your device to reboot',
        description: 'Info what is happening with users device.',
    },
    TR_FIRMWARE_INSTALLED_TEXT: {
        id: 'TR_FIRMWARE_INSTALLED_TEXT',
        defaultMessage: 'This device has already installed firmware version: {version}',
        description: 'Text to display in case device has firmware installed but it is outdated',
    },
});

export default definedMessages;
