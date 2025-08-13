export type FirmwareStatus =
    | 'initial' // initial state
    | 'check-seed' // ask user, if has seed properly backed up
    | 'started' // progress - firmware update has started, waiting for events from trezor-connect
    | 'done'; // firmware successfully installed

/**
 * Firmware check types used in the firmware security checks.
 */
export type FirmwareCheckType =
    | 'Entropy'
    | 'Firmware hash'
    | 'Firmware revision'
    | 'Firmware version';

export type ReportSecurityCheckProps = {
    level: 'error' | 'warning';
    checkType: FirmwareCheckType;
    contextData: Record<string, any>;
    payload?: unknown;
};
