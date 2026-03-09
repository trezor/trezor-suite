export const UI_EVENT = 'UI_EVENT';

export const UI_REQUEST = {
    TRANSPORT: 'ui-no_transport',
    BOOTLOADER: 'ui-device_bootloader_mode',
    NOT_IN_BOOTLOADER: 'ui-device_not_in_bootloader_mode',
    INITIALIZE: 'ui-device_not_initialized',
    SEEDLESS: 'ui-device_seedless',
    FIRMWARE_OLD: 'ui-device_firmware_old',
    FIRMWARE_OUTDATED: 'ui-device_firmware_outdated',
    FIRMWARE_NOT_SUPPORTED: 'ui-device_firmware_unsupported',
    FIRMWARE_NOT_COMPATIBLE: 'ui-device_firmware_not_compatible',
    FIRMWARE_NOT_INSTALLED: 'ui-device_firmware_not_installed',
    FIRMWARE_PROGRESS: 'ui-firmware-progress',
    FIRMWARE_PROGRESS_UNEXPECTED_DELAY: 'ui-firmware-progress-unexpected-delay',

    /** connect is waiting for device to be automatically reconnected */
    FIRMWARE_RECONNECT: 'ui-firmware_reconnect',
    FIRMWARE_DISCONNECT: 'ui-firmware_disconnect',

    FIRMWARE_DOWNLOADED: 'ui-firmware_downloaded',

    DEVICE_NEEDS_BACKUP: 'ui-device_needs_backup',

    CLOSE_UI_WINDOW: 'ui-close_window',

    REQUEST_CONFIRMATION: 'ui-request_confirmation',
    REQUEST_PIN: 'ui-request_pin',
    INVALID_PIN: 'ui-invalid_pin',
    INVALID_PIN_ATTEMPTS_DEPLETED: 'ui-invalid_pin_attempts_depleted',
    REQUEST_PASSPHRASE: 'ui-request_passphrase',
    REQUEST_PASSPHRASE_ON_DEVICE: 'ui-request_passphrase_on_device',
    REQUEST_THP_PAIRING: 'ui-request_thp_pairing',
    SELECT_ACCOUNT: 'ui-select_account',
    SELECT_FEE: 'ui-select_fee',
    UPDATE_CUSTOM_FEE: 'ui-update_custom_fee',
    INSUFFICIENT_FUNDS: 'ui-insufficient_funds',
    REQUEST_BUTTON: 'ui-button',
    REQUEST_WORD: 'ui-request_word',

    BUNDLE_PROGRESS: 'ui-bundle_progress',
    ADDRESS_VALIDATION: 'ui-address_validation',
} as const;
